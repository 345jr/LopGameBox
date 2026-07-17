import { ipcMain } from 'electron'
import { errorMessage } from '../util/errorMessage'
import type { IpcContext } from './types'

export function registerLinksIpc({ gameService }: IpcContext): void {
  ipcMain.handle('db:addGameLink', async (_event, { gameId, url, title, description, icon }) => {
    try {
      return gameService.addGameLink(gameId, url, title, description, icon)
    } catch (error: unknown) {
      console.error('[Link] add failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('db:getGameLinks', async (_event, gameId: number) => {
    try {
      return gameService.getGameLinks(gameId)
    } catch (error: unknown) {
      console.error('[Link] list failed:', errorMessage(error))
      return []
    }
  })

  ipcMain.handle('db:deleteGameLink', async (_event, linkId: number) => {
    try {
      return gameService.deleteGameLink(linkId)
    } catch (error: unknown) {
      console.error('[Link] delete failed:', errorMessage(error))
      throw error
    }
  })

  ipcMain.handle('db:updateGameLink', async (_event, { linkId, title, url }) => {
    try {
      return gameService.updateGameLink(linkId, title, url)
    } catch (error: unknown) {
      console.error('[Link] update failed:', errorMessage(error))
      throw error
    }
  })
}
