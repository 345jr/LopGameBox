import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseManager {
  private static dbInstance: DatabaseType;
  //获取数据库实例
  public static getInstance(): DatabaseType {
    if (!this.dbInstance) {
      // 在生产环境和开发环境下选择不同的数据库路径
      const dbPath = app.isPackaged
        ? path.join(path.dirname(app.getPath('exe')), 'db/gameData.db')
        : path.join(process.cwd(), 'db/gameData.db');
      this.dbInstance = new Database(dbPath);
      //打开外键约束
      this.dbInstance.pragma('foreign_keys = ON');
      this.initSchema();
    }
    return this.dbInstance;
  }
  //初始化数据库
  private static initSchema() {
    this.dbInstance.exec(`
      -- 游戏表
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_name TEXT NOT NULL,
        launch_path TEXT NOT NULL UNIQUE,
        total_play_time INTEGER DEFAULT 0,
        last_launch_time INTEGER,
        launch_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        disk_size INTEGER DEFAULT 0
      );
      -- 画廊表
      CREATE TABLE IF NOT EXISTS game_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        image_type TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        relative_path TEXT NOT NULL ,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
    `);
  }
  //关闭数据库实例
  public static close() {
    if (this.dbInstance?.open) {
      this.dbInstance.close();
    }
  }
}
