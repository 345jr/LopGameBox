import { app, ipcMain } from 'electron'
import { errorMessage } from '../util/errorMessage'
import type { IpcContext } from './types'

export function registerWindowIpc({ getMainWindow }: IpcContext): void {
  ipcMain.handle('window:minimize', () => {
    getMainWindow()?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    const win = getMainWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('window:openDevTools', () => {
    try {
      getMainWindow()?.webContents.openDevTools({ mode: 'detach' })
      return { success: true }
    } catch (err: unknown) {
      console.error('[DevTools] open failed:', err)
      return { success: false, error: errorMessage(err) }
    }
  })

  ipcMain.handle('window:close', () => {
    getMainWindow()?.close()
    app.quit()
  })

  ipcMain.handle('window:isMaximized', () => {
    return getMainWindow()?.isMaximized()
  })
}
