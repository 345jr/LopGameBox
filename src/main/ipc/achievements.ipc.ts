import { ipcMain } from 'electron'
import type { IpcContext } from './types'

export function registerAchievementsIpc({ gameService }: IpcContext): void {
  ipcMain.handle(
    'db:createAchievement',
    async (
      _event,
      gameId: number,
      achievementName: string,
      achievementType: string,
      description?: string
    ) => {
      try {
        return gameService.createAchievement(gameId, achievementName, achievementType, description)
      } catch (err: unknown) {
        console.error('[Achievement] create failed:', err)
        throw err
      }
    }
  )

  ipcMain.handle('db:deleteAchievement', async (_event, achievementId: number) => {
    try {
      gameService.deleteAchievement(achievementId)
    } catch (err: unknown) {
      console.error('[Achievement] delete failed:', err)
      throw err
    }
  })

  ipcMain.handle(
    'db:toggleAchievementStatus',
    async (_event, achievementId: number, isCompleted: 0 | 1) => {
      try {
        gameService.toggleAchievementStatus(achievementId, isCompleted)
      } catch (err: unknown) {
        console.error('[Achievement] toggle status failed:', err)
        throw err
      }
    }
  )

  ipcMain.handle('db:getGameAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getGameAchievements(gameId)
    } catch (err: unknown) {
      console.error('[Achievement] list failed:', err)
      return []
    }
  })

  ipcMain.handle('db:getCompletedAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getCompletedAchievements(gameId)
    } catch (err: unknown) {
      console.error('[Achievement] list completed failed:', err)
      return []
    }
  })

  ipcMain.handle('db:getUncompletedAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getUncompletedAchievements(gameId)
    } catch (err: unknown) {
      console.error('[Achievement] list incomplete failed:', err)
      return []
    }
  })

  ipcMain.handle('db:getAchievementStats', async (_event, gameId: number) => {
    try {
      return gameService.getAchievementStats(gameId)
    } catch (err: unknown) {
      console.error('[Achievement] stats failed:', err)
      return { total: 0, completed: 0, completionRate: 0 }
    }
  })
}
