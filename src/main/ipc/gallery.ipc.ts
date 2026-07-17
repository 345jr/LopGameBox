import { ipcMain } from 'electron'
import { errorMessage } from '../util/errorMessage'
import type { IpcContext } from './types'

export function registerGalleryIpc({ gameService }: IpcContext): void {
  ipcMain.handle('db:addBanner', async (_event, { gameId, imagePath, relativePath }) => {
    try {
      return gameService.setGameBanner(gameId, imagePath, relativePath)
    } catch (error: unknown) {
      console.error('[Clipboard] exception:', errorMessage(error))
    }
    return null
  })

  ipcMain.handle('db:getBanners', () => gameService.getBanners())

  ipcMain.handle('db:getSnapshot', async (_event, gameId, newestFirst) => {
    return gameService.getGameSnapshot(gameId, newestFirst)
  })

  ipcMain.handle('db:addSnapshot', async (_event, { gameId, imagePath, relativePath }) => {
    try {
      return gameService.setGameSnapshot(gameId, imagePath, relativePath)
    } catch (error: unknown) {
      console.error('[IPC] exception:', errorMessage(error))
      return null
    }
  })

  ipcMain.handle('db:delectSnapshot', async (_event, id) => {
    try {
      return gameService.delectSnapshot(id)
    } catch (error: unknown) {
      console.error('[Gallery] delete record failed:', errorMessage(error))
    }
  })

  ipcMain.handle('db:updateSnapshotAlt', async (_event, id: number, alt: string) => {
    try {
      return gameService.updateSnapshotAlt(id, alt)
    } catch (error: unknown) {
      console.error('[Gallery] update alt failed:', errorMessage(error))
    }
  })

  ipcMain.handle('db:deleteSnapshotAlt', async (_event, id: number) => {
    try {
      return gameService.deleteSnapshotAlt(id)
    } catch (error: unknown) {
      console.error('[Gallery] delete alt failed:', errorMessage(error))
    }
  })

  ipcMain.handle('db:getSnapshotAlt', async (_event, id: number) => {
    try {
      return gameService.getSnapshotAlt(id)
    } catch (error: unknown) {
      console.error('[Gallery] get alt failed:', errorMessage(error))
      return null
    }
  })
}
