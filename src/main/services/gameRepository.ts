import { DatabaseManager } from './databaseManager';

export class GameRepository {
  private db = DatabaseManager.getInstance();
  //添加游戏
  public addGame(gameName: string, launchPath: string, diskSize: number) {
    const stmt = this.db.prepare(`
      INSERT INTO games (game_name, launch_path, disk_size,) VALUES (?, ?, ?)
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
}
