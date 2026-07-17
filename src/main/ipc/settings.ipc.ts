import { dialog, ipcMain } from 'electron'
import {
  addDefaultBanner,
  deleteDefaultBanner,
  getDefaultBannerState,
  selectDefaultBanner
} from '../services/defaultBannerService'
import { errorMessage } from '../util/errorMessage'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:getDefaultBanners', async () => {
    try {
      return await getDefaultBannerState()
    } catch (error: unknown) {
      console.error('[Settings] getDefaultBanners failed:', errorMessage(error))
      throw error
    }
  })

  /** 打开图片选择器并添加为默认封面 */
  ipcMain.handle('settings:addDefaultBanner', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }
        ]
      })
      if (canceled || !filePaths[0]) {
        return { canceled: true as const }
      }
      const state = await addDefaultBanner(filePaths[0])
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
}
