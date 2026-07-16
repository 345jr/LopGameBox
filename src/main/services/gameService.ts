import type { RunResult } from 'better-sqlite3'
import type {
  GameAchievementRow,
  GameGalleryRow,
  GameLinkRow,
  GameLogDailyModeRow,
  GameLogDayHours,
  GameLogModeHours,
  GameRow,
  GameSaveBackupRow,
  GameSavePathRow,
  GameVersionRow
} from '../types/rows'
import { BackupService } from './backup'
import { GalleryRepository } from './galleryRepository'
import { GameLogsRepository } from './gameLogsRepository'
import { GameRepository } from './gameRepository'

export class GameService {
  constructor(
    private gameRepo: GameRepository,
    private galleryRepo: GalleryRepository,
    private gameLogsRepo: GameLogsRepository,
    private backupService: BackupService
  ) {}

  //添加游戏
  public addGame(
    gameName: string,
    launchPath: string,
    diskSize: number
  ): ReturnType<GameRepository['addGame']> {
    return this.gameRepo.addGame(gameName, launchPath, diskSize)
  }

  //获取全部游戏
  public getAllGames(): GameRow[] {
    return this.gameRepo.getAllGames()
  }

  //根据分类获取游戏
  public getGamesByCategory(category: string): GameRow[] {
    return this.gameRepo.getGamesByCategory(category)
  }

  //获取单个游戏
  public getGameById(id: number): GameRow | undefined {
    return this.gameRepo.getGameById(id)
  }

  //获取游戏路径
  public getGameByPath(path: string): GameRow | undefined {
    return this.gameRepo.getGameByPath(path)
  }

  //更新游戏数据
  public updateGameOnClose(id: number, elapsed: number): void {
    this.gameRepo.updateGameOnClose(id, elapsed)
  }

  //删除游戏
  public deleteGame(id: number): { changes: number } {
    return this.gameRepo.deleteGame(id)
  }

  //添加游戏封面图
  public setGameBanner(
    gameId: number,
    imagePath: string,
    relativePath: string
  ): ReturnType<GalleryRepository['setGameBanner']> {
    return this.galleryRepo.setGameBanner(gameId, imagePath, relativePath)
  }

  //获取游戏封面图
  public getBanners(): GameGalleryRow[] {
    return this.galleryRepo.getGameBanner()
  }

  //添加游戏快照图
  public setGameSnapshot(
    gameId: number,
    imagePath: string,
    relativePath: string
  ): ReturnType<GalleryRepository['setGameSnapshot']> {
    return this.galleryRepo.setGameSnapshot(gameId, imagePath, relativePath)
  }

  //获取游戏快照图
  public getGameSnapshot(gameId: number, newestFirst: boolean = true): GameGalleryRow[] {
    return this.galleryRepo.getGameSnapshot(gameId, newestFirst)
  }

  //删除游戏快照图
  public delectSnapshot(id: number): void {
    return this.galleryRepo.delectSnapshot(id)
  }

  //更新快照描述
  public updateSnapshotAlt(id: number, alt: string): void {
    return this.galleryRepo.updateSnapshotAlt(id, alt)
  }

  //删除快照描述
  public deleteSnapshotAlt(id: number): void {
    return this.galleryRepo.deleteSnapshotAlt(id)
  }

  //获取快照描述
  public getSnapshotAlt(id: number): string | null {
    return this.galleryRepo.getSnapshotAlt(id)
  }

  //修改游戏名
  public modifyGameName(id: number, newName: string): void {
    return this.gameRepo.modifyGameName(id, newName)
  }

  //更新游戏大小
  public updateGameSize(id: number, disk_size: number): void {
    return this.gameRepo.updateGameSize(id, disk_size)
  }

  //更新游戏路径
  public updateGamePath(id: number, newPath: string): void {
    return this.gameRepo.updateGamePath(id, newPath)
  }

  //更新游戏分类
  public updateGameCategory(id: number, category: string): void {
    return this.gameRepo.updateGameCategory(id, category)
  }

  //模糊查询搜索
  public searchGames(keyword: string): GameRow[] {
    return this.gameRepo.searchGames(keyword)
  }

  //统计游戏数量
  public countGames(): { count: number } {
    return this.gameRepo.countGames()
  }

  //统计游戏时间
  public countGameTime(): { timeCount: number | null } {
    return this.gameRepo.countGameTime()
  }

  //统计启动次数
  public countLaunchTimes(): { launchCount: number | null } {
    return this.gameRepo.countLaunchTimes()
  }

  //记录游戏记录
  public logGame(
    gameId: number,
    launchedAt: number,
    endedAt: number,
    launchState: string,
    gameMode: string = ''
  ): void {
    this.gameLogsRepo.insertGameLog(gameId, launchedAt, endedAt, launchState, gameMode)
  }

  //查询今日 ，本周 ，本月的游戏记录
  public getGameLogDayWeekMonth(): GameLogDayHours {
    return this.gameLogsRepo.getGameLogDayWeekMonth()
  }

  //查询4种模式下的游戏时长分布
  public getGameLogByMode(): GameLogModeHours {
    return this.gameLogsRepo.getGameLogByMode()
  }

  //获取本周的时长分布
  public getGameLogByModeThisWeek(): GameLogDailyModeRow[] {
    return this.gameLogsRepo.getGameLogByModeThisWeek()
  }

  //获取上周的时长分布
  public getGameLogByModeLastWeek(): GameLogDailyModeRow[] {
    return this.gameLogsRepo.getGameLogByModeLastWeek()
  }

  // 本地备份数据库
  public async backupDatabase(): Promise<string> {
    return this.backupService.backupDatabase()
  }

  //更新游戏版本
  public updateGameVersion(
    gameId: number,
    type: 'minor' | 'major',
    summary: string,
    fileSize?: number
  ): ReturnType<GameRepository['addGameVersion']> {
    const latest = this.gameRepo.getLatestVersion(gameId)

    let baseVersion: string = '1.0'
    if (latest && latest.version) {
      baseVersion = String(latest.version)
    } else {
      const game = this.gameRepo.getGameById(gameId)
      baseVersion = String(game?.game_version || '1.0')
    }

    const parts = baseVersion.split('.').map((p: string) => parseInt(p, 10) || 0)
    let major = parts[0] || 0
    let minor = parts[1] || 0

    if (type === 'major') {
      major += 1
      minor = 0
    } else {
      minor += 1
    }

    const newVersion = `${major}.${minor}`

    const inserted = this.gameRepo.addGameVersion(gameId, newVersion, summary, fileSize)
    this.gameRepo.updateGameCurrentVersion(gameId, newVersion)
    return inserted
  }

  // 查询某条版本的概述（按版本 id）
  public getVersionSummary(versionId: number): {
    id: number
    game_id: number
    version: string
    summary: string | null
    created_at: number
  } | null {
    const v = this.gameRepo.getGameVersionById(versionId)
    if (!v) return null
    return {
      id: v.id,
      game_id: v.game_id,
      version: v.version,
      summary: v.summary,
      created_at: v.created_at
    }
  }

  // 根据游戏ID查询其所有的版本信息
  public getVersionsByGame(gameId: number): GameVersionRow[] {
    return this.gameRepo.getVersionsByGame(gameId)
  }

  // 更新版本描述
  public updateVersionDescription(versionId: number, newDescription: string): void {
    return this.gameRepo.updateVersionDescription(versionId, newDescription)
  }

  // ==================== 成就相关方法 ====================

  public createAchievement(
    gameId: number,
    achievementName: string,
    achievementType: string,
    description?: string
  ): ReturnType<GalleryRepository['createAchievement']> {
    return this.galleryRepo.createAchievement(gameId, achievementName, achievementType, description)
  }

  public deleteAchievement(achievementId: number): void {
    return this.galleryRepo.deleteAchievement(achievementId)
  }

  public toggleAchievementStatus(achievementId: number, isCompleted: 0 | 1): void {
    return this.galleryRepo.toggleAchievementStatus(achievementId, isCompleted)
  }

  public getGameAchievements(gameId: number): GameAchievementRow[] {
    return this.galleryRepo.getGameAchievements(gameId)
  }

  public getCompletedAchievements(gameId: number): GameAchievementRow[] {
    return this.galleryRepo.getCompletedAchievements(gameId)
  }

  public getUncompletedAchievements(gameId: number): GameAchievementRow[] {
    return this.galleryRepo.getUncompletedAchievements(gameId)
  }

  public getAchievementStats(gameId: number): ReturnType<GalleryRepository['getAchievementStats']> {
    return this.galleryRepo.getAchievementStats(gameId)
  }

  // ==================== 外链管理相关方法 ====================

  public addGameLink(
    gameId: number,
    url: string,
    title: string,
    description: string,
    icon: string
  ): ReturnType<GameRepository['addGameLink']> {
    return this.gameRepo.addGameLink(gameId, url, title, description, icon)
  }

  public getGameLinks(gameId: number): GameLinkRow[] {
    return this.gameRepo.getGameLinks(gameId)
  }

  public deleteGameLink(linkId: number): RunResult {
    return this.gameRepo.deleteGameLink(linkId)
  }

  public updateGameLink(linkId: number, title: string, url: string): RunResult {
    return this.gameRepo.updateGameLink(linkId, title, url)
  }

  // ==================== 存档管理相关方法 ====================

  public setGameSavePath(
    gameId: number,
    savePath: string,
    fileSize: number = 0
  ): ReturnType<GameRepository['setGameSavePath']> {
    return this.gameRepo.setGameSavePath(gameId, savePath, fileSize)
  }

  public getGameSavePath(gameId: number): GameSavePathRow | undefined {
    return this.gameRepo.getGameSavePath(gameId)
  }

  public updateGameSavePath(gameId: number, savePath: string): RunResult {
    return this.gameRepo.updateGameSavePath(gameId, savePath)
  }

  public updateSavePathSize(gameId: number, fileSize: number): RunResult {
    return this.gameRepo.updateSavePathSize(gameId, fileSize)
  }

  public deleteGameSavePath(gameId: number): RunResult {
    return this.gameRepo.deleteGameSavePath(gameId)
  }

  // ==================== 存档备份相关方法 ====================

  public createSaveBackup(
    gameId: number,
    backupName: string,
    backupPath: string,
    fileSize: number
  ): { id: number | bigint } {
    return this.gameRepo.createSaveBackup(gameId, backupName, backupPath, fileSize)
  }

  public getSaveBackups(gameId: number): GameSaveBackupRow[] {
    return this.gameRepo.getSaveBackups(gameId)
  }

  public getSaveBackup(backupId: number): GameSaveBackupRow | undefined {
    return this.gameRepo.getSaveBackup(backupId)
  }

  public deleteSaveBackup(backupId: number): RunResult {
    return this.gameRepo.deleteSaveBackup(backupId)
  }
}
