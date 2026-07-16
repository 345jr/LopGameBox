import type { GameAchievementRow, GameGalleryRow } from '../types/rows'
import { DatabaseManager } from '../db/databaseManager'

export class GalleryRepository {
  private db = DatabaseManager.getInstance()

  //添加一个新的Banner图
  public setGameBanner(
    gameId: number,
    imagePath: string,
    relativePath: string
  ): { id: number | bigint; imagePath: string; type: string; relativePath: string } {
    // 先删除旧封面
    this.db
      .prepare('DELETE FROM game_gallery WHERE game_id = ? AND image_type = ?')
      .run(gameId, 'banner')
    // 插入新封面
    const stmt = this.db.prepare(
      'INSERT INTO game_gallery (game_id, image_path, image_type , relative_path) VALUES (?,?,?,?)'
    )
    const info = stmt.run(gameId, imagePath, 'banner', relativePath)
    return {
      id: info.lastInsertRowid,
      imagePath,
      type: 'banner',
      relativePath
    }
  }

  //获取全部的Banner图数据
  public getGameBanner(): GameGalleryRow[] {
    return this.db
      .prepare('SELECT * FROM game_gallery WHERE image_type = ?')
      .all('banner') as GameGalleryRow[]
  }

  //添加一个新的游戏快照
  public setGameSnapshot(
    gameId: number,
    imagePath: string,
    relativePath: string
  ): { id: number | bigint; imagePath: string; type: string; relativePath: string } {
    const stmt = this.db.prepare(
      'INSERT INTO game_gallery (game_id, image_path, image_type , relative_path) VALUES (?,?,?,?)'
    )
    const info = stmt.run(gameId, imagePath, 'snapshot', relativePath)
    return {
      id: info.lastInsertRowid,
      imagePath,
      type: 'snapshot',
      relativePath
    }
  }

  //获取游戏的快照，默认按 created_at 降序（从新到旧）
  public getGameSnapshot(game_id: number, newestFirst: boolean = true): GameGalleryRow[] {
    const order = newestFirst ? 'DESC' : 'ASC'
    const sql = `SELECT * FROM game_gallery WHERE game_id = ? AND image_type = ? ORDER BY created_at ${order}`
    return this.db.prepare(sql).all(game_id, 'snapshot') as GameGalleryRow[]
  }

  //删除某个游戏的快照
  public delectSnapshot(id: number): void {
    const stmt = this.db.prepare('DELETE FROM game_gallery WHERE id = ?')
    stmt.run(id)
    console.log('[Gallery] snapshot deleted')
  }

  /**
   * 给快照添加/更新描述信息
   */
  public updateSnapshotAlt(id: number, alt: string): void {
    const stmt = this.db.prepare('UPDATE game_gallery SET alt = ? WHERE id = ?')
    stmt.run(alt, id)
    console.log('[Gallery] alt updated')
  }

  /**
   * 删除快照的描述信息
   */
  public deleteSnapshotAlt(id: number): void {
    const stmt = this.db.prepare('UPDATE game_gallery SET alt = NULL WHERE id = ?')
    stmt.run(id)
    console.log('[Gallery] alt deleted')
  }

  /**
   * 获取快照的描述信息
   */
  public getSnapshotAlt(id: number): string | null {
    const result = this.db.prepare('SELECT alt FROM game_gallery WHERE id = ?').get(id) as
      { alt: string | null } | undefined
    return result?.alt || null
  }

  // ==================== 成就相关方法 ====================

  public createAchievement(
    gameId: number,
    achievementName: string,
    achievementType: string,
    description?: string
  ): {
    id: number | bigint
    gameId: number
    achievementName: string
    achievementType: string
    description?: string
    isCompleted: number
  } {
    const stmt = this.db.prepare(
      'INSERT INTO game_achievements (game_id, achievement_name, achievement_type, description) VALUES (?, ?, ?, ?)'
    )
    const info = stmt.run(gameId, achievementName, achievementType, description || null)
    return {
      id: info.lastInsertRowid,
      gameId,
      achievementName,
      achievementType,
      description,
      isCompleted: 0
    }
  }

  public deleteAchievement(achievementId: number): void {
    const stmt = this.db.prepare('DELETE FROM game_achievements WHERE id = ?')
    stmt.run(achievementId)
    console.log('[Achievement] deleted')
  }

  public toggleAchievementStatus(achievementId: number, isCompleted: 0 | 1): void {
    if (isCompleted === 1) {
      const stmt = this.db.prepare(
        "UPDATE game_achievements SET is_completed = 1, completed_at = strftime('%s','now') WHERE id = ?"
      )
      stmt.run(achievementId)
    } else {
      const stmt = this.db.prepare(
        'UPDATE game_achievements SET is_completed = 0, completed_at = NULL WHERE id = ?'
      )
      stmt.run(achievementId)
    }
    console.log('[Achievement] status updated')
  }

  public getGameAchievements(gameId: number): GameAchievementRow[] {
    return this.db
      .prepare('SELECT * FROM game_achievements WHERE game_id = ? ORDER BY created_at DESC')
      .all(gameId) as GameAchievementRow[]
  }

  public getCompletedAchievements(gameId: number): GameAchievementRow[] {
    return this.db
      .prepare(
        'SELECT * FROM game_achievements WHERE game_id = ? AND is_completed = 1 ORDER BY completed_at DESC'
      )
      .all(gameId) as GameAchievementRow[]
  }

  public getUncompletedAchievements(gameId: number): GameAchievementRow[] {
    return this.db
      .prepare(
        'SELECT * FROM game_achievements WHERE game_id = ? AND is_completed = 0 ORDER BY created_at DESC'
      )
      .all(gameId) as GameAchievementRow[]
  }

  public getAchievementStats(gameId: number): {
    total: number
    completed: number
    completionRate: number
  } {
    const result = this.db
      .prepare(
        'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM game_achievements WHERE game_id = ?'
      )
      .get(gameId) as { total: number; completed: number | null } | undefined
    const total = result?.total ?? 0
    const completed = result?.completed || 0
    return {
      total,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    }
  }
}

