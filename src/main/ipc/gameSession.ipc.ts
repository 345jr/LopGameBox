import { ipcMain } from 'electron'
import type { IpcContext } from './types'

export function registerGameSessionIpc({ gameSession }: IpcContext): void {
  ipcMain.handle(
    'shell:executeFile',
    async (_event, game: { id: number; path: string; gameMode: string }) => {
      return gameSession.executeFile(game)
    }
  )

  ipcMain.handle('op:setGameMode', (_event, mode: string) => {
    gameSession.setGameMode(mode)
  })

  ipcMain.handle('op:setResting', (_event, resting: boolean) => {
    gameSession.setResting(resting)
  })
}
