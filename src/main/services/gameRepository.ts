import { DatabaseManager } from './databaseManager';

export class GameRepository {
  private db = DatabaseManager.getInstance();
  //添加游戏
  public addGame(gameName: string, launchPath: string, diskSize: number) {
    const stmt = this.db.prepare(`
      INSERT INTO games (game_name, launch_path, disk_size) VALUES (?, ?, ?)
    `);
    const info = stmt.run(gameName, launchPath, diskSize);
    return { id: info.lastInsertRowid, gameName, launchPath, diskSize };
  }
  //查询游戏列表
  public getAllGames() {
    const stmt = this.db.prepare(`
      SELECT * FROM games ORDER BY last_launch_time DESC, game_name ASC
    `);
    return stmt.all();
  }
  //根据分类查询游戏列表
  public getGamesByCategory(category: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM games WHERE category = ? ORDER BY last_launch_time DESC, game_name ASC
    `);
    return stmt.all(category);
  }
  //根据游戏获取地址(用于查重)
  public getGameByPath(launchPath: string) {
    const stmt = this.db.prepare('SELECT * FROM games WHERE launch_path = ?');
    return stmt.get(launchPath);
  }
  //更新游戏数据(关闭时)
  public updateGameOnClose(id: number, elapsedTime: number) {
    const stmt = this.db.prepare(`
      UPDATE games SET
        total_play_time = total_play_time + ?,
        launch_count = launch_count + 1,
        last_launch_time = strftime('%s', 'now'),
        updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(elapsedTime, id);
  }
  //删除游戏
  public deleteGame(id: number) {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
    const info = stmt.run(id);
    return { changes: info.changes };
  }
  //修改游戏名
  public modifyGameName(id: number, newName: string) {
    const stmt = this.db.prepare(`UPDATE games SET game_name = ? WHERE id = ?`);
    stmt.run(newName, id);
    console.log(`modify success!`);
  }
  //重新计算游戏大小
  public updateGameSize(id: number, disk_size: number) {
    const stmt = this.db.prepare(`UPDATE games SET disk_size = ? WHERE id = ?`);
    stmt.run(disk_size, id);
    console.log('get disk_size success');
  }
  //更新游戏路径
  public updateGamePath(id: number, newPath: string) {
    const stmt = this.db.prepare(`UPDATE games SET launch_path = ?, updated_at = strftime('%s', 'now') WHERE id = ?`);
    stmt.run(newPath, id);
    console.log('update game path success');
  }
  //更新游戏分类
  public updateGameCategory(id: number, category: string) {
    const stmt = this.db.prepare(`UPDATE games SET category = ?, updated_at = strftime('%s', 'now') WHERE id = ?`);
    stmt.run(category, id);
    console.log('update game category success');
  }
  //通过ID查询游戏
  public getGameById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?');
    return stmt.get(id);
  }
  //模糊搜索游戏
  public searchGames(keyword: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM games WHERE game_name LIKE ? ORDER BY last_launch_time DESC
    `);
    return stmt.all(`%${keyword}%`);
  }
  //统计游戏数量
  public countGames() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM games');
    return stmt.get();
  }
  //统计游戏时间
  public countGameTime() {
    const stmt = this.db.prepare('SELECT SUM(total_play_time) as timeCount FROM games');
    return stmt.get();
  }
  //统计启动次数
  public countLaunchTimes() {
    const stmt = this.db.prepare('SELECT SUM(launch_count) as launchCount FROM games');
    return stmt.get();
  }
  // 插入一条新的游戏版本记录
  public addGameVersion(gameId: number, version: string, summary: string, fileSize?: number) {
    const stmt = this.db.prepare(`
      INSERT INTO game_versions (game_id, version, summary, file_size, created_at, updated_at)
      VALUES (?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))
    `);
    const info = stmt.run(gameId, version, summary, fileSize || null);
    return { id: info.lastInsertRowid, gameId, version, summary, fileSize };
  }

  // 根据 game_id 获取最新的一条版本记录
  public getLatestVersion(gameId: number) {
    const stmt = this.db.prepare(`
      SELECT * FROM game_versions WHERE game_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
    `);
    return stmt.get(gameId);
  }

  // 根据版本 id 查询版本记录
  public getGameVersionById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM game_versions WHERE id = ?');
    return stmt.get(id);
  }

  // 根据 game_id 与 version 字符串查一条记录
  public getGameVersionByGameAndVersion(gameId: number, version: string) {
    const stmt = this.db.prepare('SELECT * FROM game_versions WHERE game_id = ? AND version = ?');
    return stmt.get(gameId, version);
  }

  // 根据 game_id 查询该游戏的所有版本（按时间降序）
  public getVersionsByGame(gameId: number) {
    const stmt = this.db.prepare(
      'SELECT * FROM game_versions WHERE game_id = ? ORDER BY created_at DESC, id DESC',
    );
    return stmt.all(gameId);
  }

  // 同步更新 games 表中的 game_version 字段
  public updateGameCurrentVersion(gameId: number, version: string) {
    const stmt = this.db.prepare(
      `UPDATE games SET game_version = ?, updated_at = strftime('%s','now') WHERE id = ?`,
    );
    stmt.run(version, gameId);
  }

  // 更新版本描述
  public updateVersionDescription(versionId: number, newDescription: string) {
    const stmt = this.db.prepare(
      `UPDATE game_versions SET summary = ?, updated_at = strftime('%s','now') WHERE id = ?`,
    );
    stmt.run(newDescription, versionId);
    console.log('update version description success');
  }
}
