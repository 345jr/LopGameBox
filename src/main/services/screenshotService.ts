import { app, globalShortcut, BrowserWindow } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'

export class ScreenshotService {
  private shortcutEnabled = false

  constructor(private getWindow: () => BrowserWindow | null) {}

  async capture(): Promise<void> {
    const mainWindow = this.getWindow()
    if (!mainWindow) return

    try {
      const screenshot = await mainWindow.webContents.capturePage()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `screenshot-${timestamp}.png`

      const screenshotDir = app.isPackaged
        ? path.join(path.dirname(app.getPath('exe')), 'screenshots')
        : path.join(process.cwd(), 'screenshots')

      await fs.mkdir(screenshotDir, { recursive: true })
      const filepath = path.join(screenshotDir, filename)
      await fs.writeFile(filepath, screenshot.toPNG())

      mainWindow.webContents.send('screenshot:success', { path: filepath, filename })
      console.log('[Screenshot] saved:', filepath)
    } catch (error) {
      console.error('[Screenshot] failed:', error)
      mainWindow.webContents.send('screenshot:error', { error: String(error) })
    }
  }

  enableShortcut(): void {
    if (this.shortcutEnabled) return
    try {
      globalShortcut.register('F12', () => {
        void this.capture()
      })
      this.shortcutEnabled = true
      console.log('[Screenshot] shortcut F12 registered')
    } catch (error) {
      console.error('[Screenshot] failed to register shortcut:', error)
    }
  }

  disableShortcut(): void {
    if (!this.shortcutEnabled) return
    try {
      globalShortcut.unregister('F12')
      this.shortcutEnabled = false
      console.log('[Screenshot] shortcut F12 unregistered')
    } catch (error) {
      console.error('[Screenshot] failed to unregister shortcut:', error)
    }
  }

  isShortcutEnabled(): boolean {
    return this.shortcutEnabled
  }
}
