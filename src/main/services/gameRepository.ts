import type { RunResult } from 'better-sqlite3'
import type {
  GameLinkRow,
  GameRow,
  GameSaveBackupRow,
  GameSavePathRow,
  GameVersionRow
} from '../types/rows'
import { DatabaseManager } from './databaseManager'

export class GameRepository {
  private db = DatabaseManager.getInstance()

  //添加游戏
  public addGame(
    gameName: string,
    launchPath: string,
    diskSize: number
  ): { id: number | bigint; gameName: string; launchPath: string; diskSize: number } {
    const stmt = this.db.prepare(`
      INSERT INTO games (game_name, launch_path, disk_size) VALUES (?, ?, ?)
    `)
    const info = stmt.run(gameName, launchPath, diskSize)
    return { id: info.lastInsertRowid, gameName, launchPath, diskSize }
  }

  //查询游戏列表
  public getAllGames(): GameRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM games ORDER BY last_launch_time DESC, created_at DESC
    `)
    return stmt.all() as GameRow[]
  }

  //根据分类查询游戏列表
  public getGamesByCategory(category: string): GameRow[] {
    // 如果 category 为 'all' 或为空/undefined，返回全部游戏
    if (!category || category.toLowerCase() === 'all') {
      const stmt = this.db.prepare(`
        SELECT * FROM games ORDER BY last_launch_time DESC, created_at DESC
      `)
      return stmt.all() as GameRow[]
    }

    const stmt = this.db.prepare(`
      SELECT * FROM games WHERE category = ? ORDER BY last_launch_time DESC, created_at DESC
    `)
    return stmt.all(category) as GameRow[]
  }

  //根据游戏获取地址(用于查重)
  public getGameByPath(launchPath: string): GameRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM games WHERE launch_path = ?')
    return stmt.get(launchPath) as GameRow | undefined
  }

  //更新游戏数据(关闭时)
  public updateGameOnClose(id: number, elapsedTime: number): void {
    const stmt = this.db.prepare(`
      UPDATE games SET
        total_play_time = total_play_time + ?,
        launch_count = launch_count + 1,
        last_launch_time = strftime('%s', 'now'),
        updated_at = strftime('%s', 'now')
      WHERE id = ?
    `)
    stmt.run(elapsedTime, id)
  }

  //删除游戏
  public deleteGame(id: number): { changes: number } {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?')
    const info = stmt.run(id)
    return { changes: info.changes }
  }

  //修改游戏名
  public modifyGameName(id: number, newName: string): void {
    const stmt = this.db.prepare(`UPDATE games SET game_name = ? WHERE id = ?`)
    stmt.run(newName, id)
    console.log(`modify success!`)
  }

  //重新计算游戏大小
  public updateGameSize(id: number, disk_size: number): void {
    const stmt = this.db.prepare(`UPDATE games SET disk_size = ? WHERE id = ?`)
    stmt.run(disk_size, id)
    console.log('get disk_size success')
  }

  //更新游戏路径
  public updateGamePath(id: number, newPath: string): void {
    const stmt = this.db.prepare(
      `UPDATE games SET launch_path = ?, updated_at = strftime('%s', 'now') WHERE id = ?`
    )
    stmt.run(newPath, id)
    console.log('update game path success')
  }

  //更新游戏分类
  public updateGameCategory(id: number, category: string): void {
    const stmt = this.db.prepare(
      `UPDATE games SET category = ?, updated_at = strftime('%s', 'now') WHERE id = ?`
    )
    stmt.run(category, id)
    console.log('update game category success')
  }

  //通过ID查询游戏
  public getGameById(id: number): GameRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?')
    return stmt.get(id) as GameRow | undefined
  }

  //模糊搜索游戏
  public searchGames(keyword: string): GameRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM games WHERE game_name LIKE ? ORDER BY last_launch_time DESC, created_at DESC
    `)
    return stmt.all(`%${keyword}%`) as GameRow[]
  }

  //统计游戏数量
  public countGames(): { count: number } {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM games')
    return stmt.get() as { count: number }
  }

  //统计游戏时间
  public countGameTime(): { timeCount: number | null } {
    const stmt = this.db.prepare('SELECT SUM(total_play_time) as timeCount FROM games')
    return stmt.get() as { timeCount: number | null }
  }

  //统计启动次数
  public countLaunchTimes(): { launchCount: number | null } {
    const stmt = this.db.prepare('SELECT SUM(launch_count) as launchCount FROM games')
    return stmt.get() as { launchCount: number | null }
  }

  // 插入一条新的游戏版本记录
  public addGameVersion(
    gameId: number,
    version: string,
    summary: string,
    fileSize?: number
  ): {
    id: number | bigint
    gameId: number
    version: string
    summary: string
    fileSize?: number
  } {
    const stmt = this.db.prepare(`
      INSERT INTO game_versions (game_id, version, summary, file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))
    `)
    const info = stmt.run(gameId, version, summary, fileSize || null)
    return { id: info.lastInsertRowid, gameId, version, summary, fileSize }
  }

  // 根据 game_id 获取最新的一条版本记录
  public getLatestVersion(gameId: number): GameVersionRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM game_versions WHERE game_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
    `)
    return stmt.get(gameId) as GameVersionRow | undefined
  }

  // 根据版本 id 查询版本记录
  public getGameVersionById(id: number): GameVersionRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM game_versions WHERE id = ?')
    return stmt.get(id) as GameVersionRow | undefined
  }

  // 根据 game_id 与 version 字符串查一条记录
  public getGameVersionByGameAndVersion(
    gameId: number,
    version: string
  ): GameVersionRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM game_versions WHERE game_id = ? AND version = ?')
    return stmt.get(gameId, version) as GameVersionRow | undefined
  }

  // 根据 game_id 查询该游戏的所有版本（按时间降序）
  public getVersionsByGame(gameId: number): GameVersionRow[] {
    const stmt = this.db.prepare(
      'SELECT * FROM game_versions WHERE game_id = ? ORDER BY created_at DESC, id DESC'
    )
    return stmt.all(gameId) as GameVersionRow[]
  }

  // 同步更新 games 表中的 game_version 字段
  public updateGameCurrentVersion(gameId: number, version: string): void {
    const stmt = this.db.prepare(
      `UPDATE games SET game_version = ?, updated_at = strftime('%s','now') WHERE id = ?`
    )
    stmt.run(version, gameId)
  }

  // 更新版本描述
  public updateVersionDescription(versionId: number, newDescription: string): void {
    const stmt = this.db.prepare(
      `UPDATE game_versions SET summary = ?, updated_at = strftime('%s','now') WHERE id = ?`
    )
    stmt.run(newDescription, versionId)
    console.log('update version description success')
  }

  // ==================== 外链管理相关方法 ====================

  public addGameLink(
    gameId: number,
    url: string,
    title: string,
    description: string,
    icon: string
  ): {
    id: number | bigint
    gameId: number
    url: string
    title: string
    description: string
    icon: string
  } {
    const stmt = this.db.prepare(`
      INSERT INTO game_links (game_id, url, title, description, icon)
      VALUES (?, ?, ?, ?, ?)
    `)
    const info = stmt.run(gameId, url, title, description, icon)
    return {
      id: info.lastInsertRowid,
      gameId,
      url,
      title,
      description,
      icon
    }
  }

  public getGameLinks(gameId: number): GameLinkRow[] {
    return this.db
      .prepare('SELECT * FROM game_links WHERE game_id = ? ORDER BY created_at DESC')
      .all(gameId) as GameLinkRow[]
  }

  public deleteGameLink(linkId: number): RunResult {
    const stmt = this.db.prepare('DELETE FROM game_links WHERE id = ?')
    return stmt.run(linkId)
  }

  public updateGameLink(linkId: number, title: string, url: string): RunResult {
    const stmt = this.db.prepare(`
      UPDATE game_links 
      SET title = ?, url = ?, updated_at = strftime('%s','now')
      WHERE id = ?
    `)
    return stmt.run(title, url, linkId)
  }

  // ==================== 存档管理相关方法 ====================

  public setGameSavePath(
    gameId: number,
    savePath: string,
    fileSize: number = 0
  ): { id: number | bigint; gameId: number; savePath: string; fileSize: number } {
    const stmt = this.db.prepare(`
      INSERT INTO game_save_paths (game_id, save_path, file_size)
      VALUES (?, ?, ?)
      ON CONFLICT(game_id) DO UPDATE SET 
        save_path = excluded.save_path,
        file_size = excluded.file_size,
        updated_at = strftime('%s','now')
    `)
    const info = stmt.run(gameId, savePath, fileSize)
    return {
      id: info.lastInsertRowid,
      gameId,
      savePath,
      fileSize
    }
  }

  public getGameSavePath(gameId: number): GameSavePathRow | undefined {
    return this.db.prepare('SELECT * FROM game_save_paths WHERE game_id = ?').get(gameId) as
      GameSavePathRow | undefined
  }

  public updateGameSavePath(gameId: number, savePath: string): RunResult {
    const stmt = this.db.prepare(`
      UPDATE game_save_paths 
      SET save_path = ?, updated_at = strftime('%s','now')
      WHERE game_id = ?
    `)
    return stmt.run(savePath, gameId)
  }

  public updateSavePathSize(gameId: number, fileSize: number): RunResult {
    const stmt = this.db.prepare(`
      UPDATE game_save_paths 
      SET file_size = ?, updated_at = strftime('%s','now')
      WHERE game_id = ?
    `)
    return stmt.run(fileSize, gameId)
  }

  public deleteGameSavePath(gameId: number): RunResult {
    const stmt = this.db.prepare('DELETE FROM game_save_paths WHERE game_id = ?')
    return stmt.run(gameId)
  }

  public createSaveBackup(
    gameId: number,
    backupName: string,
    backupPath: string,
    fileSize: number
  ): { id: number | bigint } {
    const stmt = this.db.prepare(`
      INSERT INTO game_save_backups (game_id, backup_name, backup_path, file_size)
      VALUES (?, ?, ?, ?)
    `)
    const info = stmt.run(gameId, backupName, backupPath, fileSize)
    return { id: info.lastInsertRowid }
  }

  public getSaveBackups(gameId: number): GameSaveBackupRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM game_save_backups
      WHERE game_id = ?
      ORDER BY created_at DESC
    `)
    return stmt.all(gameId) as GameSaveBackupRow[]
  }

  public getSaveBackup(backupId: number): GameSaveBackupRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM game_save_backups WHERE id = ?')
    return stmt.get(backupId) as GameSaveBackupRow | undefined
  }

  public deleteSaveBackup(backupId: number): RunResult {
    const stmt = this.db.prepare('DELETE FROM game_save_backups WHERE id = ?')
    return stmt.run(backupId)
  }
}
