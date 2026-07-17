import { ipcMain } from 'electron'
import { getSize } from '../util/diskSize'
import { errorMessage } from '../util/errorMessage'
import type { GameRow } from '../types/rows'
import type { IpcContext } from './types'

export function registerGamesIpc({ gameService }: IpcContext): void {
  ipcMain.handle('db:getAllGames', () => gameService.getAllGames())

  ipcMain.handle('db:getGamesByCategory', (_event, category: string) => {
    return gameService.getGamesByCategory(category)
  })

  ipcMain.handle('db:getGameById', (_event, id: number) => {
    return gameService.getGameById(id)
  })

  ipcMain.handle('db:addGame', async (_event, { gameName, launchPath }) => {
    const existingGame = gameService.getGameByPath(launchPath)
    try {
      if (existingGame) {
        throw new Error('这个游戏路径已存在！')
      }
      const gameSize = await getSize(launchPath)
      return gameService.addGame(gameName, launchPath, gameSize)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error('一个不知道的错误发生了!')
    }
  })

  ipcMain.handle('db:updateGameSize', async (_event, id, launch_path) => {
    try {
      const disk_size = await getSize(launch_path)
      gameService.updateGameSize(id, disk_size)
      return disk_size
    } catch (error: unknown) {
      console.error('[Size] get game size failed:', errorMessage(error))
      return 0
    }
  })

  ipcMain.handle('db:deleteGame', (_event, id: number) => {
    return gameService.deleteGame(id)
  })

  ipcMain.handle('db:modifyGameName', async (_event, id, newName) => {
    try {
      gameService.modifyGameName(id, newName)
    } catch (error) {
      console.error('[Game] rename failed:', error)
    }
  })

  ipcMain.handle('db:searchGames', async (_event, keyword) => {
    try {
      return gameService.searchGames(keyword)
    } catch (error: unknown) {
      console.error('[Search] failed:', errorMessage(error))
      return []
    }
  })

  ipcMain.handle('db:updateGamePath', async (_event, gameId: number, newPath: string) => {
    try {
      const existingGame = gameService.getGameByPath(newPath) as GameRow | undefined
      if (existingGame && existingGame.id !== gameId) {
        throw new Error('该路径已被其他游戏使用！')
      }
      gameService.updateGamePath(gameId, newPath)
      return { success: true, message: '路径更新成功' }
    } catch (err: unknown) {
      console.error('[Game] update path failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:updateGameCategory', (_event, gameId: number, category: string) => {
    try {
      gameService.updateGameCategory(gameId, category)
      return { success: true, message: '分类更新成功' }
    } catch (err: unknown) {
      console.error('[Game] update category failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle(
    'db:updateGameVersion',
    async (_event, gameId: number, type: 'minor' | 'major', summary: string, fileSize?: number) => {
      try {
        return gameService.updateGameVersion(gameId, type, summary, fileSize)
      } catch (err: unknown) {
        console.error('[Version] update failed:', err)
        throw err
      }
    }
  )

  ipcMain.handle('db:getVersionSummary', (_event, versionId: number) => {
    try {
      return gameService.getVersionSummary(versionId)
    } catch (err: unknown) {
      console.error('[Version] get overview failed:', err)
      return null
    }
  })

  ipcMain.handle('db:getVersionsByGame', (_event, gameId: number) => {
    try {
      return gameService.getVersionsByGame(gameId)
    } catch (err: unknown) {
      console.error('[Version] list failed:', err)
      return []
    }
  })

  ipcMain.handle(
    'db:updateVersionDescription',
    async (_event, versionId: number, newDescription: string) => {
      try {
        gameService.updateVersionDescription(versionId, newDescription)
        return { success: true, message: '版本描述更新成功' }
      } catch (err: unknown) {
        console.error('[Version] update description failed:', err)
        return { success: false, message: errorMessage(err) }
      }
    }
  )

  ipcMain.handle('db:backupDatabase', async () => {
    try {
      const backupPath = await gameService.backupDatabase()
      return { success: true, path: backupPath }
    } catch (err: unknown) {
      console.error('[Backup] local backup failed:', err)
      return { success: false, error: errorMessage(err) }
    }
  })
}
