import { ipcMain } from 'electron'
import type { IpcContext } from './types'

export function registerScreenshotIpc({ screenshot }: IpcContext): void {
  ipcMain.handle('screenshot:enableShortcut', () => {
    screenshot.enableShortcut()
    return { success: true, message: '截图快捷键已启用' }
  })

  ipcMain.handle('screenshot:disableShortcut', () => {
    screenshot.disableShortcut()
    return { success: true, message: '截图快捷键已禁用' }
  })

  ipcMain.handle('screenshot:getShortcutStatus', () => {
    return { enabled: screenshot.isShortcutEnabled() }
  })

  ipcMain.handle('screenshot:take', async () => {
    await screenshot.capture()
  })
}
