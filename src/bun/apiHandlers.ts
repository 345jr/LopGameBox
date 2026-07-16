import path from 'path'
import * as fs from 'fs/promises'
import { BrowserWindow, GlobalShortcut, Utils } from 'electrobun/bun'
import type { GameService } from './services/gameService'
import type { GameRuntime } from './gameRuntime'
import type { DropFilePayload, GameRow, GameSaveBackupRow, GameSavePathRow, TempDropPayload } from './types/rows'
import { getSize, getFolderSize } from './util/diskSize'
import { copyDirectory } from './util/fileOperations'
import { errorMessage } from './util/errorMessage'
import {
  getDeletePath,
  getSaveBackupsDir,
  getScreenshotsDir,
  getTempPath,
  getUserDataPath
} from './paths'

export type ApiContext = {
  getWindow: () => BrowserWindow
  gameService: GameService
  runtime: GameRuntime
  assetBaseUrl: string
  getScreenshotEnabled: () => boolean
  setScreenshotEnabled: (v: boolean) => void
  onScreenshotRequest: () => void
}

type Handler = (ctx: ApiContext, ...args: any[]) => any | Promise<any>

/**
 * Handlers keyed by the same method names as `window.api.*` in the renderer.
 */
export const apiHandlers: Record<string, Handler> = {
  openFile: async () => {
    const paths = await Utils.openFileDialog({
      startingFolder: Utils.paths.home,
      allowedFileTypes: '*',
      canChooseFiles: true,
      canChooseDirectory: false,
      allowsMultipleSelection: false
    })
    return paths?.find((p) => p && p.trim()) ?? null
  },

  selectFolder: async () => {
    const paths = await Utils.openFileDialog({
      startingFolder: Utils.paths.home,
      allowedFileTypes: '*',
      canChooseFiles: false,
      canChooseDirectory: true,
      allowsMultipleSelection: false
    })
    return paths?.find((p) => p && p.trim()) ?? null
  },

  executeFile: (ctx, game: { id: number; path: string; gameMode: string }) =>
    ctx.runtime.executeFile(game),

  getAllGames: (ctx) => ctx.gameService.getAllGames(),
  getGamesByCategory: (ctx, category: string) => ctx.gameService.getGamesByCategory(category),
  getGameById: (ctx, id: number) => ctx.gameService.getGameById(id),

  addGame: async (ctx, game: { gameName: string; launchPath: string }) => {
    const existing = ctx.gameService.getGameByPath(game.launchPath)
    if (existing) throw new Error('这个游戏路径已存在！')
    const gameSize = await getSize(game.launchPath)
    return ctx.gameService.addGame(game.gameName, game.launchPath, gameSize)
  },

  deleteGame: (ctx, id: number) => ctx.gameService.deleteGame(id),

  getBanners: (ctx) => ctx.gameService.getBanners(),

  addBanner: (ctx, gameImage: { gameId: number; imagePath: string; relativePath: string }) =>
    ctx.gameService.setGameBanner(gameImage.gameId, gameImage.imagePath, gameImage.relativePath),

  getGameSnapshot: (ctx, gameId: number, newestFirst: boolean = true) =>
    ctx.gameService.getGameSnapshot(gameId, newestFirst),

  addGameSnapshot: (ctx, gameImage: { gameId: number; imagePath: string; relativePath: string }) =>
    ctx.gameService.setGameSnapshot(gameImage.gameId, gameImage.imagePath, gameImage.relativePath),

  delectSnapshot: (ctx, id: number) => {
    ctx.gameService.delectSnapshot(id)
    return { changes: 1 }
  },

  updateSnapshotAlt: (ctx, id: number, alt: string) => ctx.gameService.updateSnapshotAlt(id, alt),
  deleteSnapshotAlt: (ctx, id: number) => ctx.gameService.deleteSnapshotAlt(id),
  getSnapshotAlt: (ctx, id: number) => ctx.gameService.getSnapshotAlt(id),

  modifyGameName: (ctx, id: number, newName: string) => ctx.gameService.modifyGameName(id, newName),

  updateGameSize: async (ctx, id: number, launch_path: string) => {
    try {
      const disk_size = await getSize(launch_path)
      ctx.gameService.updateGameSize(id, disk_size)
      return disk_size
    } catch (error: unknown) {
      console.error('[Size] get game size failed:', errorMessage(error))
      return 0
    }
  },

  getFolderSize: async (_ctx, folderPath: string) => {
    try {
      return await getFolderSize(folderPath)
    } catch (error: unknown) {
      console.error('[Size] get folder size failed:', errorMessage(error))
      return 0
    }
  },

  updateGamePath: (ctx, gameId: number, newPath: string) => {
    try {
      const existing = ctx.gameService.getGameByPath(newPath) as GameRow | undefined
      if (existing && existing.id !== gameId) {
        throw new Error('该路径已被其他游戏使用！')
      }
      ctx.gameService.updateGamePath(gameId, newPath)
      return { success: true, message: '路径更新成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  updateGameCategory: (ctx, gameId: number, category: string) => {
    try {
      ctx.gameService.updateGameCategory(gameId, category)
      return { success: true, message: '分类更新成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  searchGames: (ctx, keyword: string) => {
    try {
      return ctx.gameService.searchGames(keyword)
    } catch {
      return []
    }
  },

  countGames: (ctx) => ctx.gameService.countGames(),
  countGameTime: (ctx) => ctx.gameService.countGameTime(),
  countLaunchTimes: (ctx) => ctx.gameService.countLaunchTimes(),
  countDayWeekMonth: (ctx) => ctx.gameService.getGameLogDayWeekMonth(),
  getGameLogByMode: (ctx) => ctx.gameService.getGameLogByMode(),
  getGameLogByModeThisWeek: (ctx) => ctx.gameService.getGameLogByModeThisWeek(),
  getGameLogByModeLastWeek: (ctx) => ctx.gameService.getGameLogByModeLastWeek(),

  copyImages: async (
    _ctx,
    move: { origin: string; target: string; gameName: string; oldFilePath: string }
  ) => {
    try {
      const time = Date.now()
      const ext = path.extname(move.origin) || '.jpg'
      const gameNameExtension = `${move.gameName}-${time}${ext}`.replace(/\s/g, '')
      const targetDir = path.join(getUserDataPath(), move.target)
      await fs.mkdir(targetDir, { recursive: true })
      const imageName = path.join(targetDir, gameNameExtension)
      const filePath = getDeletePath(move.oldFilePath)
      if (filePath !== 'skip') {
        try {
          await fs.unlink(filePath)
        } catch (err: unknown) {
          const code =
            typeof err === 'object' && err !== null && 'code' in err
              ? String((err as { code?: unknown }).code)
              : undefined
          if (code && code !== 'ENOENT') {
            console.warn('[Banner] non-fatal delete old cover:', errorMessage(err))
          }
        }
      }
      await fs.copyFile(move.origin, imageName)
      console.log('[File] copy success')
      const relativePath = path.posix.join(move.target.replace(/\\+/g, '/'), gameNameExtension)
      return { relativePath }
    } catch (error: unknown) {
      console.error('[File] copy failed:', error)
      const defaultRel = path.posix.join(move.target.replace(/\\+/g, '/'), 'default.jpg')
      return { relativePath: defaultRel }
    }
  },

  delectImages: async (_ctx, relative_path: string) => {
    try {
      const p = getDeletePath(relative_path)
      if (p !== 'skip') await fs.unlink(p)
      console.log('[File] deleted')
      return 'ok'
    } catch (error: unknown) {
      console.error('[File] delete failed:', errorMessage(error))
      return 'error'
    }
  },

  getTempDrop: async (_ctx, payload: TempDropPayload) => {
    try {
      const files: DropFilePayload[] = payload?.files || []
      for (const f of files) {
        if (f.buffer) {
          try {
            const tempDir = getTempPath()
            const fileName = `临时图片-${Date.now()}-${(f.name || 'file').replace(/[^a-zA-Z0-9_.-]/g, '_')}`
            const dest = path.join(tempDir, fileName)
            await fs.writeFile(dest, Buffer.from(f.buffer as Uint8Array))
            return { success: true, tempPath: dest }
          } catch (err: unknown) {
            return { success: false, error: errorMessage(err) }
          }
        }
        return { success: false, error: '没有可用的路径或缓冲区' }
      }
      return { success: false, error: '没有处理的文件' }
    } catch (err: unknown) {
      return { success: false, error: errorMessage(err) }
    }
  },

  openFolder: (_ctx, folderPath: string) => {
    try {
      Utils.showItemInFolder(folderPath)
    } catch (error: unknown) {
      console.error('[Folder] open failed:', errorMessage(error))
    }
  },

  sendNotification: (_ctx, title: string, body: string) => {
    Utils.showNotification({ title, body })
  },

  setGameMode: (ctx, mode: string) => ctx.runtime.setGameMode(mode),
  setResting: (ctx, resting: boolean) => ctx.runtime.setResting(resting),

  backupDatabase: async (ctx) => {
    try {
      const backupPath = await ctx.gameService.backupDatabase()
      return { success: true, path: backupPath }
    } catch (err: unknown) {
      return { success: false, error: errorMessage(err) }
    }
  },

  updateGameVersion: (
    ctx,
    gameId: number,
    type: 'minor' | 'major',
    summary: string,
    fileSize?: number
  ) => ctx.gameService.updateGameVersion(gameId, type, summary, fileSize),

  getVersionSummary: (ctx, versionId: number) => ctx.gameService.getVersionSummary(versionId),
  getVersionsByGame: (ctx, gameId: number) => ctx.gameService.getVersionsByGame(gameId),

  updateVersionDescription: (ctx, versionId: number, newDescription: string) => {
    try {
      ctx.gameService.updateVersionDescription(versionId, newDescription)
      return { success: true, message: '版本描述更新成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  createAchievement: (
    ctx,
    gameId: number,
    achievementName: string,
    achievementType: string,
    description?: string
  ) => ctx.gameService.createAchievement(gameId, achievementName, achievementType, description),

  deleteAchievement: (ctx, achievementId: number) =>
    ctx.gameService.deleteAchievement(achievementId),

  toggleAchievementStatus: (ctx, achievementId: number, isCompleted: 0 | 1) =>
    ctx.gameService.toggleAchievementStatus(achievementId, isCompleted),

  getGameAchievements: (ctx, gameId: number) => ctx.gameService.getGameAchievements(gameId),
  getCompletedAchievements: (ctx, gameId: number) =>
    ctx.gameService.getCompletedAchievements(gameId),
  getUncompletedAchievements: (ctx, gameId: number) =>
    ctx.gameService.getUncompletedAchievements(gameId),
  getAchievementStats: (ctx, gameId: number) => ctx.gameService.getAchievementStats(gameId),

  addGameLink: (
    ctx,
    gameId: number,
    metadata: { url: string; title: string; description: string; favicon: string }
  ) =>
    ctx.gameService.addGameLink(
      gameId,
      metadata.url,
      metadata.title,
      metadata.description,
      metadata.favicon
    ),

  getGameLinks: (ctx, gameId: number) => ctx.gameService.getGameLinks(gameId),
  deleteGameLink: (ctx, linkId: number) => ctx.gameService.deleteGameLink(linkId),
  updateGameLink: (ctx, linkId: number, title: string, url: string) =>
    ctx.gameService.updateGameLink(linkId, title, url),

  setGameSavePath: (ctx, gameId: number, savePath: string, fileSize: number = 0) =>
    ctx.gameService.setGameSavePath(gameId, savePath, fileSize),

  getGameSavePath: (ctx, gameId: number) => ctx.gameService.getGameSavePath(gameId) ?? null,

  updateGameSavePath: (ctx, gameId: number, savePath: string) => {
    try {
      ctx.gameService.updateGameSavePath(gameId, savePath)
      return { success: true, message: '存档路径更新成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  updateSavePathSize: (ctx, gameId: number, fileSize: number) => {
    try {
      ctx.gameService.updateSavePathSize(gameId, fileSize)
      return { success: true, message: '存档大小更新成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  deleteGameSavePath: (ctx, gameId: number) => {
    try {
      ctx.gameService.deleteGameSavePath(gameId)
      return { success: true, message: '存档路径删除成功' }
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) }
    }
  },

  createSaveBackup: async (ctx, gameId: number) => {
    try {
      const savePathInfo = ctx.gameService.getGameSavePath(gameId) as GameSavePathRow | undefined
      if (!savePathInfo) throw new Error('未找到游戏存档路径')

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

      const backupsDir = getSaveBackupsDir()
      await fs.mkdir(backupsDir, { recursive: true })
      const backupDir = path.join(backupsDir, String(timestamp))
      await copyDirectory(savePathInfo.save_path, backupDir)
      const fileSize = await getFolderSize(backupDir)
      const result = ctx.gameService.createSaveBackup(gameId, backupName, backupDir, fileSize)
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
  },

  getSaveBackups: (ctx, gameId: number) => {
    try {
      return ctx.gameService.getSaveBackups(gameId)
    } catch {
      return []
    }
  },

  restoreSaveBackup: async (ctx, backupId: number, gameId: number) => {
    try {
      const backup = ctx.gameService.getSaveBackup(backupId) as GameSaveBackupRow | undefined
      if (!backup) throw new Error('备份不存在')
      const savePathInfo = ctx.gameService.getGameSavePath(gameId) as GameSavePathRow | undefined
      if (!savePathInfo) throw new Error('未找到游戏存档路径')

      const tempBackupDir = path.join(getTempPath(), `save_temp_${Date.now()}`)
      await copyDirectory(savePathInfo.save_path, tempBackupDir)
      try {
        await fs.rm(savePathInfo.save_path, { recursive: true, force: true })
        await fs.mkdir(savePathInfo.save_path, { recursive: true })
        await copyDirectory(backup.backup_path, savePathInfo.save_path)
        await fs.rm(tempBackupDir, { recursive: true, force: true })
        const newSize = await getFolderSize(savePathInfo.save_path)
        ctx.gameService.updateSavePathSize(gameId, newSize)
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
  },

  deleteSaveBackup: async (ctx, backupId: number) => {
    try {
      const backup = ctx.gameService.getSaveBackup(backupId) as GameSaveBackupRow | undefined
      if (!backup) throw new Error('备份不存在')
      await fs.rm(backup.backup_path, { recursive: true, force: true })
      ctx.gameService.deleteSaveBackup(backupId)
      return { success: true, message: '备份删除成功' }
    } catch (err: unknown) {
      console.error('[Save] delete backup failed:', err)
      return { success: false, message: errorMessage(err) }
    }
  },

  minimizeWindow: (ctx) => {
    ctx.getWindow().minimize()
  },

  maximizeWindow: (ctx) => {
    const win = ctx.getWindow()
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  },

  closeWindow: (ctx) => {
    ctx.getWindow().close()
    Utils.quit()
  },

  isWindowMaximized: (ctx) => ctx.getWindow().isMaximized(),

  openDevTools: (ctx) => {
    try {
      ctx.getWindow().webview.openDevTools()
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: errorMessage(err) }
    }
  },

  enableScreenshotShortcut: (ctx) => {
    if (!ctx.getScreenshotEnabled()) {
      const ok = GlobalShortcut.register('F12', () => ctx.onScreenshotRequest())
      ctx.setScreenshotEnabled(ok)
      console.log('[Screenshot] F12 registered:', ok)
    }
    return { success: true, message: '截图快捷键已启用' }
  },

  disableScreenshotShortcut: (ctx) => {
    if (ctx.getScreenshotEnabled()) {
      GlobalShortcut.unregister('F12')
      ctx.setScreenshotEnabled(false)
      console.log('[Screenshot] F12 unregistered')
    }
    return { success: true, message: '截图快捷键已禁用' }
  },

  getScreenshotShortcutStatus: (ctx) => ({ enabled: ctx.getScreenshotEnabled() }),

  /** Called by webview after capturing PNG base64 */
  saveScreenshotPng: async (_ctx, base64Png: string) => {
    try {
      const dir = getScreenshotsDir()
      await fs.mkdir(dir, { recursive: true })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `screenshot-${timestamp}.png`
      const filepath = path.join(dir, filename)
      const data = Buffer.from(base64Png.replace(/^data:image\/png;base64,/, ''), 'base64')
      await fs.writeFile(filepath, data)
      console.log('[Screenshot] saved:', filepath)
      return { success: true, path: filepath, filename }
    } catch (err: unknown) {
      console.error('[Screenshot] failed:', err)
      return { success: false, error: errorMessage(err) }
    }
  },

  getAssetBaseUrl: (ctx) => ctx.assetBaseUrl,

  /** Lightweight health check used by the renderer while waiting for the socket. */
  ping: (_ctx, payload?: { note?: string }) => ({
    ok: true as const,
    runtime: 'electrobun' as const,
    ts: Date.now(),
    note: payload?.note
  }),

  getRuntimeInfo: (ctx) => ({
    platform: process.platform,
    bunVersion: Bun.version,
    userData: getUserDataPath(),
    assetBaseUrl: ctx.assetBaseUrl
  })
}

export async function dispatchApi(
  ctx: ApiContext,
  method: string,
  args: unknown[] = []
): Promise<unknown> {
  const handler = apiHandlers[method]
  if (!handler) {
    throw new Error(`Unknown API method: ${method}`)
  }
  return handler(ctx, ...args)
}
