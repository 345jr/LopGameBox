import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { GameService } from './services/gameService'
import { GameRepository } from './services/gameRepository'
import { GalleryRepository } from './services/galleryRepository'
import { GameLogsRepository } from './services/gameLogsRepository'
import { BackupService } from './services/backup'
import { GameSession } from './services/gameSession'
import { ScreenshotService } from './services/screenshotService'
import { createWindow, getMainWindow } from './app/window'
import { registerLopProtocol, registerPrivilegedSchemes } from './app/protocol'
import { registerAllIpc } from './ipc'

// 协议特权声明必须在 app ready 之前
registerPrivilegedSchemes()

const gameService = new GameService(
  new GameRepository(),
  new GalleryRepository(),
  new GameLogsRepository(),
  new BackupService()
)

const gameSession = new GameSession(gameService, getMainWindow)
const screenshot = new ScreenshotService(getMainWindow)

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  registerLopProtocol()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAllIpc({
    gameService,
    gameSession,
    screenshot,
    getMainWindow
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
