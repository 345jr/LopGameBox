import type { GameService } from '../services/gameService'
import type { GameSession } from '../services/gameSession'
import type { ScreenshotService } from '../services/screenshotService'
import type { BrowserWindow } from 'electron'

export type IpcContext = {
  gameService: GameService
  gameSession: GameSession
  screenshot: ScreenshotService
  getMainWindow: () => BrowserWindow | null
}
