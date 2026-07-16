import { spawn, type ChildProcess } from 'child_process'
import path from 'path'
import { Utils } from 'electrobun/bun'
import type { GameService } from './services/gameService'
import { errorMessage } from './util/errorMessage'

export type RuntimeEvents = {
  onTimerUpdate: (elapsed: number) => void
  onTimerStopped: (result: { code: number; finalElapsedTime: number; error?: string }) => void
  onOpenRestTimeModal: () => void
}

/**
 * Game process lifecycle + rest-mode timers (ported from Electron main).
 */
export class GameRuntime {
  private childProcess: ChildProcess | null = null
  private timerInterval: ReturnType<typeof setInterval> | null = null
  private gracePeriodTimeout: ReturnType<typeof setTimeout> | null = null
  private startTime: number | null = null
  private gameMode: string | undefined
  private gracePeriod = false
  private isResting = false
  private elapsedTimeSeconds = 0
  private modeToggleLog = false
  private modeToggle: string[] = ['', '']
  private isLoged = false

  constructor(
    private gameService: GameService,
    private events: RuntimeEvents
  ) {}

  setGameMode(mode: string): void {
    this.modeToggleLog = true
    this.modeToggle[0] = this.gameMode as string
    this.modeToggle[1] = mode
    this.gameMode = mode
  }

  setResting(resting: boolean): void {
    this.isResting = resting
    if (resting === false) this.isLoged = false
    this.gracePeriod = false
    console.log('[Rest] isResting:', this.isResting)
  }

  async executeFile(game: {
    id: number
    path: string
    gameMode: string
  }): Promise<{ success: boolean; message?: string }> {
    if (this.childProcess) {
      return { success: false, message: '已有另一个应用在运行中。' }
    }
    try {
      const exeDir = path.dirname(game.path)
      this.childProcess = spawn(game.path, [], { stdio: 'ignore', cwd: exeDir })
      this.gameMode = game.gameMode
      this.startTime = Date.now()
      const StartTimeNoLog = Date.now()

      return await new Promise((resolve) => {
        this.childProcess?.on('error', (err) => {
          console.error('[IPC] error:', errorMessage(err))
          this.events.onTimerStopped({
            code: -1,
            finalElapsedTime: 0,
            error: errorMessage(err)
          })
          this.gameService.logGame(game.id, this.startTime || 0, Date.now(), 'error', this.gameMode)
          this.cleanupProcess()
          resolve({ success: false, message: `启动子进程失败: ${errorMessage(err)}` })
        })

        this.childProcess?.on('spawn', () => {
          let lastAfkNotifySec = 0
          this.isLoged = false
          this.modeToggleLog = false

          this.timerInterval = setInterval(() => {
            if (this.startTime && !this.gracePeriod && !this.isResting) {
              const elapsedTime = Date.now() - this.startTime
              this.elapsedTimeSeconds = Math.round(elapsedTime / 1000)
              this.events.onTimerUpdate(this.elapsedTimeSeconds)

              if (this.modeToggleLog && !this.isLoged) {
                this.gameService.logGame(
                  game.id,
                  this.startTime,
                  Date.now(),
                  'success',
                  this.modeToggle[0]
                )
                this.modeToggleLog = false
                this.elapsedTimeSeconds = 0
                this.startTime = Date.now()
              }

              try {
                switch (this.gameMode) {
                  case 'Normal':
                    if (this.elapsedTimeSeconds >= 60 * 40) {
                      Utils.showNotification({
                        title: '普通模式提醒',
                        body: '您已经玩了超过 40 分钟！'
                      })
                      this.gracePeriod = true
                      this.events.onOpenRestTimeModal()
                    }
                    break
                  case 'Fast':
                    if (this.elapsedTimeSeconds >= 60 * 20) {
                      Utils.showNotification({
                        title: '快速模式提醒',
                        body: '您已经玩了超过 20 分钟！'
                      })
                      this.gracePeriod = true
                      this.events.onOpenRestTimeModal()
                    }
                    break
                  case 'Afk':
                    if (this.elapsedTimeSeconds - lastAfkNotifySec >= 60 * 60) {
                      Utils.showNotification({
                        title: '挂机模式提醒',
                        body: '您已经挂机1小时'
                      })
                      lastAfkNotifySec = this.elapsedTimeSeconds
                    }
                    break
                  case 'Test':
                    if (this.elapsedTimeSeconds > 60) {
                      Utils.showNotification({
                        title: '测试模式提醒',
                        body: '您已经玩了超过 1 分钟！'
                      })
                      this.gracePeriod = true
                      this.events.onOpenRestTimeModal()
                    }
                    break
                  default:
                    break
                }
              } catch (error) {
                console.error('[Rest] reminder error:', error)
              }
            } else if (this.gracePeriod) {
              if (!this.isLoged) {
                this.gameService.logGame(
                  game.id,
                  this.startTime || 0,
                  Date.now(),
                  'success',
                  this.gameMode
                )
                this.isLoged = true
                this.startTime = Date.now()
                this.gracePeriodTimeout = setTimeout(
                  () => {
                    this.gracePeriod = false
                    this.gameMode = 'Infinity'
                  },
                  1000 * 60 * 5
                )
              }
            } else if (this.isResting) {
              if (this.gracePeriodTimeout) {
                clearTimeout(this.gracePeriodTimeout)
                this.gracePeriodTimeout = null
              }
              if (!this.isLoged) {
                this.gameService.logGame(
                  game.id,
                  this.startTime || 0,
                  Date.now(),
                  'success',
                  this.gameMode
                )
                this.events.onOpenRestTimeModal()
                this.isLoged = true
              }
              this.startTime = Date.now()
            }
          }, 1000)

          resolve({ success: true })
        })

        this.childProcess?.on('close', (code) => {
          console.log('[Game] process exit code:', code)
          if (this.timerInterval) {
            clearInterval(this.timerInterval)
            if (this.gracePeriodTimeout) clearTimeout(this.gracePeriodTimeout)
          }
          const finalElapsedTime = StartTimeNoLog ? Date.now() - StartTimeNoLog : 0
          const finalElapsedSeconds = Math.round(finalElapsedTime / 1000)
          this.events.onTimerStopped({
            code: code ?? 0,
            finalElapsedTime: finalElapsedSeconds
          })
          this.gameService.updateGameOnClose(game.id, finalElapsedSeconds)
          this.gameService.logGame(
            game.id,
            this.startTime || 0,
            Date.now(),
            'success',
            this.gameMode
          )
          this.cleanupProcess()
        })
      })
    } catch (err: unknown) {
      console.error('[IPC] error:', errorMessage(err))
      this.cleanupProcess()
      return { success: false, message: errorMessage(err) }
    }
  }

  private cleanupProcess(): void {
    this.childProcess = null
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.timerInterval = null
    if (this.gracePeriodTimeout) clearTimeout(this.gracePeriodTimeout)
    this.gracePeriodTimeout = null
    this.startTime = null
  }
}
