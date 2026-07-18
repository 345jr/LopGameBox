import { app, dialog, ipcMain } from 'electron'
import path from 'path'
import {
  addDefaultBanner,
  deleteDefaultBanner,
  getDefaultBannerState,
  selectDefaultBanner
} from '../services/defaultBannerService'
import {
  addAppBackground,
  deleteAppBackground,
  getAppBackgroundState,
  selectAppBackground
} from '../services/appBackgroundService'
import { errorMessage } from '../util/errorMessage'

const IMAGE_FILTERS = [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }]

async function pickImageFile(): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: IMAGE_FILTERS
  })
  if (canceled || !filePaths[0]) return null
  return filePaths[0]
}

export function registerSettingsIpc(): void {
  // ---------- 路径信息 ----------
  ipcMain.handle('settings:getPaths', () => {
    const isPackaged = app.isPackaged
    return {
      database: isPackaged
        ? path.join(app.getPath('userData'), 'gameData.db')
        : path.join(process.cwd(), 'db/gameData.db'),
      screenshots: isPackaged
        ? path.join(path.dirname(app.getPath('exe')), 'screenshots')
        : path.join(process.cwd(), 'screenshots'),
      saveBackups: isPackaged
        ? path.join(path.dirname(app.getPath('exe')), 'saveBackups')
        : path.join(process.cwd(), 'saveBackups')
    }
  })

  // ---------- 默认游戏封面 ----------
  ipcMain.handle('settings:getDefaultBanners', async () => {
    try {
      return await getDefaultBannerState()
    } catch (error: unknown) {
      console.error('[Settings] getDefaultBanners failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:addDefaultBanner', async () => {
    try {
      const file = await pickImageFile()
      if (!file) return { canceled: true as const }
      const state = await addDefaultBanner(file)
      return { canceled: false as const, state }
    } catch (error: unknown) {
      console.error('[Settings] addDefaultBanner failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:selectDefaultBanner', async (_event, id: string) => {
    try {
      return await selectDefaultBanner(id)
    } catch (error: unknown) {
      console.error('[Settings] selectDefaultBanner failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:deleteDefaultBanner', async (_event, id: string) => {
    try {
      return await deleteDefaultBanner(id)
    } catch (error: unknown) {
      console.error('[Settings] deleteDefaultBanner failed:', errorMessage(error))
      throw error
    }
  })

  // ---------- 应用背景 ----------
  ipcMain.handle('settings:getAppBackgrounds', async () => {
    try {
      return await getAppBackgroundState()
    } catch (error: unknown) {
      console.error('[Settings] getAppBackgrounds failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:addAppBackground', async () => {
    try {
      const file = await pickImageFile()
      if (!file) return { canceled: true as const }
      const state = await addAppBackground(file)
      return { canceled: false as const, state }
    } catch (error: unknown) {
      console.error('[Settings] addAppBackground failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:selectAppBackground', async (_event, id: string | null) => {
    try {
      return await selectAppBackground(id)
    } catch (error: unknown) {
      console.error('[Settings] selectAppBackground failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('settings:deleteAppBackground', async (_event, id: string) => {
    try {
      return await deleteAppBackground(id)
    } catch (error: unknown) {
      console.error('[Settings] deleteAppBackground failed:', errorMessage(error))
      throw error
    }
  })
}
