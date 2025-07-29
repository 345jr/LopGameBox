import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

import path from 'path';
import { app } from 'electron';

export class GameService {
  private db: DatabaseType;

  constructor() {
    let dbPath: string;
    // 生产环境：获取可执行文件所在目录
    if (app.isPackaged) {
      dbPath = path.join(path.dirname(app.getPath('exe')), 'db/gameData.db');
    } else {
      // 开发环境：使用项目根目录
      dbPath = path.join(process.cwd(), 'db/gameData.db');
    }
    this.db = new Database(dbPath);
    // 启用外键支持
    this.db.pragma('foreign_keys = ON');
    this.initDatabase();
  }
  //初始化
  private initDatabase(): void {
    this.db 
      .exec(`
      -- 游戏主表
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT, --游戏主id
        game_name TEXT NOT NULL, -- 游戏名字
        launch_path TEXT NOT NULL UNIQUE, -- UNIQUE约束防止添加重复路径的游戏
        total_play_time INTEGER DEFAULT 0, -- 单位：秒
        last_launch_time INTEGER,          -- UNIX 时间戳 (秒)
        launch_count INTEGER DEFAULT 0, --启动次数
        created_at INTEGER DEFAULT (strftime('%s', 'now')), -- 创建时间
        updated_at INTEGER DEFAULT (strftime('%s', 'now')), -- 更新时间
        disk_size INTEGER DEFAULT 0  -- 磁盘占用大小
      );
      -- 游戏图集表
        CREATE TABLE IF NOT EXISTS game_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,           -- 图片文件路径
        image_type TEXT NOT NULL,           -- 'banner' 或 'screenshot'
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        );
    `);
  }

  public addGame(gameName: string, launchPath: string, disk_size: number) {
    const stmt = this.db.prepare(
      'INSERT INTO games (game_name, launch_path, disk_size) VALUES (?, ?, ?)',
    );
    const info = stmt.run(gameName, launchPath, disk_size);
    return { id: info.lastInsertRowid, gameName, launchPath, disk_size };
  }

  public getAllGames() {
    const stmt = this.db.prepare(
      'SELECT * FROM games ORDER BY last_launch_time DESC, game_name ASC',
    );
    return stmt.all();
  }

  public getGameByPath(launchPath: string) {
    const stmt = this.db.prepare('SELECT * FROM games WHERE launch_path = ?');
    return stmt.get(launchPath);
  }

  public updateGameOnClose(id: number, elapsedTime: number) {
    const stmt = this.db.prepare(`
      UPDATE games
      SET
        total_play_time = total_play_time + ?,
        launch_count = launch_count + 1,
        last_launch_time = strftime('%s', 'now'),
        updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(elapsedTime, id);
  }

  public deleteGame(id: number) {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
    const info = stmt.run(id);
    return { changes: info.changes };
  }

  public close() {
    if (this.db.open) {
      this.db.close();
    }
  }
}
