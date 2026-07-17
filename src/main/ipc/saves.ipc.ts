import { app, ipcMain } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { getFolderSize } from '../util/diskSize'
import { copyDirectory } from '../util/fileOperations'
import { errorMessage } from '../util/errorMessage'
import type { GameSaveBackupRow, GameSavePathRow } from '../types/rows'
import type { IpcContext } from './types'

export function registerSavesIpc({ gameService }: IpcContext): void {
  ipcMain.handle(
    'db:setGameSavePath',
    async (_event, gameId: number, savePath: string, fileSize: number) => {
      try {
        return gameService.setGameSavePath(gameId, savePath, fileSize)
      } catch (err: unknown) {
        console.error('[Save] set main path failed:', err)
        throw err
      }
    }
  )

  ipcMain.handle('db:getGameSavePath', async (_event, gameId: number) => {
    try {
      return gameService.getGameSavePath(gameId)
    } catch (err: unknown) {
      console.error('[Save] get main path failed:', err)
      return null
    }
  })

  ipcMain.handle('db:updateGameSavePath', async (_event, gameId: number, savePath: string) => {
    try {
      gameService.updateGameSavePath(gameId, savePath)
      return { success: true, message: '存档路径更新成功' }
    } catch (err: unknown) {
      console.error('[Save] update main path failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:updateSavePathSize', async (_event, gameId: number, fileSize: number) => {
    try {
      gameService.updateSavePathSize(gameId, fileSize)
      return { success: true, message: '存档大小更新成功' }
    } catch (err: unknown) {
      console.error('[Save] update folder size failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:deleteGameSavePath', async (_event, gameId: number) => {
    try {
      gameService.deleteGameSavePath(gameId)
      return { success: true, message: '存档路径删除成功' }
    } catch (err: unknown) {
      console.error('[Save] delete main path failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:createSaveBackup', async (_event, gameId: number) => {
    try {
      const savePathInfo = gameService.getGameSavePath(gameId) as GameSavePathRow | undefined
      if (!savePathInfo) {
        throw new Error('未找到游戏存档路径')
      }

      const timestamp = Date.now()
      const backupName = `存档备份-${new Date(timestamp)
        .toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        .replace(/\//g, '-')
        .replace(/:/g, '-')
        .replace(/\s/g, '_')}`

      const backupsDir = app.isPackaged
        ? path.join(path.dirname(app.getPath('exe')), 'saveBackups')
        : path.join(process.cwd(), 'saveBackups')
      await fs.mkdir(backupsDir, { recursive: true })

      const backupDir = path.join(backupsDir, String(timestamp))
      await copyDirectory(savePathInfo.save_path, backupDir)

      const fileSize = await getFolderSize(backupDir)
      const result = gameService.createSaveBackup(gameId, backupName, backupDir, fileSize)

      return {
        success: true,
        message: '备份创建成功',
        backupId: result.id,
        backupName,
        fileSize
      }
    } catch (err: unknown) {
      console.error('[Save] create backup failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:getSaveBackups', async (_event, gameId: number) => {
    try {
      return gameService.getSaveBackups(gameId)
    } catch (err: unknown) {
      console.error('[Save] list backups failed:', err)
      return []
    }
  })

  ipcMain.handle('db:restoreSaveBackup', async (_event, backupId: number, gameId: number) => {
    try {
      const backup = gameService.getSaveBackup(backupId) as GameSaveBackupRow | undefined
      if (!backup) {
        throw new Error('备份不存在')
      }

      const savePathInfo = gameService.getGameSavePath(gameId) as GameSavePathRow | undefined
      if (!savePathInfo) {
        throw new Error('未找到游戏存档路径')
      }

      const tempBackupDir = path.join(app.getPath('temp'), `save_temp_${Date.now()}`)
      await copyDirectory(savePathInfo.save_path, tempBackupDir)

      try {
        await fs.rm(savePathInfo.save_path, { recursive: true, force: true })
        await fs.mkdir(savePathInfo.save_path, { recursive: true })
        await copyDirectory(backup.backup_path, savePathInfo.save_path)
        await fs.rm(tempBackupDir, { recursive: true, force: true })

        const newSize = await getFolderSize(savePathInfo.save_path)
        gameService.updateSavePathSize(gameId, newSize)

        return { success: true, message: '备份恢复成功' }
      } catch (restoreErr) {
        await fs.rm(savePathInfo.save_path, { recursive: true, force: true })
        await copyDirectory(tempBackupDir, savePathInfo.save_path)
        await fs.rm(tempBackupDir, { recursive: true, force: true })
        throw restoreErr
      }
    } catch (err: unknown) {
      console.error('[Save] restore backup failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })

  ipcMain.handle('db:deleteSaveBackup', async (_event, backupId: number) => {
    try {
      const backup = gameService.getSaveBackup(backupId) as GameSaveBackupRow | undefined
      if (!backup) {
        throw new Error('备份不存在')
      }

      await fs.rm(backup.backup_path, { recursive: true, force: true })
      gameService.deleteSaveBackup(backupId)

      return { success: true, message: '备份删除成功' }
    } catch (err: unknown) {
      console.error('[Save] delete backup failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  })
}
