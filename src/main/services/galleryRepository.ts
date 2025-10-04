import { DatabaseManager } from './databaseManager';

export class GalleryRepository {
  private db = DatabaseManager.getInstance();

  //添加一个新的Banner图
  public setGameBanner(gameId: number, imagePath: string, relativePath: string) {
    // 先删除旧封面
    this.db
      .prepare('DELETE FROM game_gallery WHERE game_id = ? AND image_type = ?')
      .run(gameId, 'banner');
    // 插入新封面
    const stmt = this.db.prepare(
      'INSERT INTO game_gallery (game_id, image_path, image_type , relative_path) VALUES (?,?,?,?)',
    );
    const info = stmt.run(gameId, imagePath, 'banner', relativePath);
    return {
      id: info.lastInsertRowid,
      imagePath,
      type: 'banner',
      relativePath,
    };
  }

  //获取全部的Banner图数据
  public getGameBanner() {
    return this.db.prepare('SELECT * FROM game_gallery WHERE image_type = ?').all('banner');
  }

  //添加一个新的游戏快照
  public setGameSnapshot(gameId: number, imagePath: string, relativePath: string) {
    const stmt = this.db.prepare(
      'INSERT INTO game_gallery (game_id, image_path, image_type , relative_path) VALUES (?,?,?,?)',
    );
    const info = stmt.run(gameId, imagePath, 'snapshot', relativePath);
    return {
      id: info.lastInsertRowid,
      imagePath,
      type: 'snapshot',
      relativePath,
    };
  }

  //获取游戏的快照
  public getGameSnapshot(game_id: number) {
    return this.db
      .prepare('SELECT * FROM game_gallery WHERE game_id = ? AND image_type = ?')
      .all(game_id, 'snapshot');
  }

  //删除某个游戏的快照
  public delectSnapshot(id: number) {
    const stmt = this.db.prepare('DELETE FROM game_gallery WHERE id = ?');
    stmt.run(id);
    console.log(`删除成功`);
  }

  // ==================== 成就相关方法 ====================
  
  /**
   * 为某个游戏创建成就
   * @param gameId 游戏ID
   * @param achievementName 成就名称
   * @param achievementType 成就类型
   * @param description 成就描述(可选)
   */
  public createAchievement(
    gameId: number,
    achievementName: string,
    achievementType: string,
    description?: string,
  ) {
    const stmt = this.db.prepare(
      'INSERT INTO game_achievements (game_id, achievement_name, achievement_type, description) VALUES (?, ?, ?, ?)',
    );
    const info = stmt.run(gameId, achievementName, achievementType, description || null);
    return {
      id: info.lastInsertRowid,
      gameId,
      achievementName,
      achievementType,
      description,
      isCompleted: 0,
    };
  }

  /**
   * 删除某个游戏的成就
   * @param achievementId 成就ID
   */
  public deleteAchievement(achievementId: number) {
    const stmt = this.db.prepare('DELETE FROM game_achievements WHERE id = ?');
    stmt.run(achievementId);
    console.log(`成就删除成功`);
  }

  /**
   * 切换成就的完成状态
   * @param achievementId 成就ID
   * @param isCompleted 是否完成: 0=未完成, 1=已完成
   */
  public toggleAchievementStatus(achievementId: number, isCompleted: 0 | 1) {
    if (isCompleted === 1) {
      // 标记为已完成,记录完成时间
      const stmt = this.db.prepare(
        "UPDATE game_achievements SET is_completed = 1, completed_at = strftime('%s','now') WHERE id = ?",
      );
      stmt.run(achievementId);
    } else {
      // 标记为未完成,清除完成时间
      const stmt = this.db.prepare(
        'UPDATE game_achievements SET is_completed = 0, completed_at = NULL WHERE id = ?',
      );
      stmt.run(achievementId);
    }
    console.log(`成就状态更新成功`);
  }

  /**
   * 获取某个游戏的所有成就
   * @param gameId 游戏ID
   */
  public getGameAchievements(gameId: number) {
    return this.db
      .prepare('SELECT * FROM game_achievements WHERE game_id = ? ORDER BY created_at DESC')
      .all(gameId);
  }

  /**
   * 获取某个游戏已完成的成就
   * @param gameId 游戏ID
   */
  public getCompletedAchievements(gameId: number) {
    return this.db
      .prepare(
        'SELECT * FROM game_achievements WHERE game_id = ? AND is_completed = 1 ORDER BY completed_at DESC',
      )
      .all(gameId);
  }

  /**
   * 获取某个游戏未完成的成就
   * @param gameId 游戏ID
   */
  public getUncompletedAchievements(gameId: number) {
    return this.db
      .prepare(
        'SELECT * FROM game_achievements WHERE game_id = ? AND is_completed = 0 ORDER BY created_at DESC',
      )
      .all(gameId);
  }

  /**
   * 获取游戏成就统计信息
   * @param gameId 游戏ID
   */
  public getAchievementStats(gameId: number) {
    const result: any = this.db
      .prepare(
        'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM game_achievements WHERE game_id = ?',
      )
      .get(gameId);
    return {
      total: result.total,
      completed: result.completed || 0,
      completionRate: result.total > 0 ? ((result.completed || 0) / result.total) * 100 : 0,
    };
  }
}
