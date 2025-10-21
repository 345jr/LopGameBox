import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

export class DatabaseManager {
  private static dbInstance: DatabaseType;
  
  //获取数据库实例
  public static getInstance(): DatabaseType {
    if (!this.dbInstance) {
      // 根据环境选择数据库路径
      const dbPath = app.isPackaged
        ? path.join(app.getPath('userData'), 'gameData.db')  // 生产环境：用户数据目录
        : path.join(process.cwd(), 'db/gameData.db');        // 开发环境：项目目录
      
      console.log('数据库路径:', dbPath);
      
      // 生产环境下，确保数据库目录存在
      if (app.isPackaged) {
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
          console.log('创建数据库目录:', dbDir);
        }
      }
      
      // 创建或打开数据库
      this.dbInstance = new Database(dbPath);
      
      //打开外键约束
      this.dbInstance.pragma('foreign_keys = ON');
      
      // 初始化数据库结构
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
        total_play_time INTEGER DEFAULT 0, --秒
        last_launch_time INTEGER,
        launch_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        disk_size INTEGER DEFAULT 0,
        game_version TEXT NOT NULL DEFAULT '1.0',
        category TEXT DEFAULT 'all'
      );
      -- 画廊表
      CREATE TABLE IF NOT EXISTS game_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        image_type TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        relative_path TEXT NOT NULL ,
        alt TEXT, 
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 游戏记录表
      CREATE TABLE IF NOT EXISTS game_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 日志ID
      game_id INTEGER NOT NULL,              -- 对应 games.id
      play_time INTEGER NOT NULL,            -- 本次游玩时长（秒）
      launched_at INTEGER NOT NULL,          -- 启动时间
      ended_at INTEGER,                      -- 结束时间
      launch_state TEXT NOT NULL,           -- 启动状态
      game_mode TEXT DEFAULT 'Normal',      -- 游戏模式 (Normal, Fast, Afk, Infinity)
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 建索引，加快按时间查询的速度
      CREATE INDEX IF NOT EXISTS idx_game_logs_launched_at ON game_logs (launched_at);
      CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs (game_id);
      
      -- 游戏版本表：存储每个游戏的历史版本信息
      CREATE TABLE IF NOT EXISTS game_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        summary TEXT,
        file_size INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 复合唯一索引，确保同一游戏的版本号唯一
      CREATE UNIQUE INDEX IF NOT EXISTS idx_game_versions_gameid_version ON game_versions (game_id, version);
      
      -- 游戏成就表：存储每个游戏的成就信息
      CREATE TABLE IF NOT EXISTS game_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        achievement_name TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        description TEXT,
        is_completed INTEGER DEFAULT 0 CHECK(is_completed IN (0, 1)),
        created_at INTEGER DEFAULT (strftime('%s','now')),
        completed_at INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 索引，加快按游戏ID和完成状态查询的速度
      CREATE INDEX IF NOT EXISTS idx_game_achievements_game_id ON game_achievements (game_id);
      CREATE INDEX IF NOT EXISTS idx_game_achievements_completed ON game_achievements (is_completed);
      
      -- 游戏链接表：存储每个游戏的相关网页链接及元数据
      CREATE TABLE IF NOT EXISTS game_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        icon TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 复合唯一索引，确保同一游戏下URL唯一
      CREATE UNIQUE INDEX IF NOT EXISTS idx_game_links_gameid_url ON game_links (game_id, url);
      -- 索引，加快按游戏ID查询的速度
      CREATE INDEX IF NOT EXISTS idx_game_links_game_id ON game_links (game_id);
      
      -- 游戏存档路径表：存储每个游戏的主存档文件夹路径
      CREATE TABLE IF NOT EXISTS game_save_paths (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL UNIQUE,
        save_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 索引，加快按游戏ID查询的速度
      CREATE INDEX IF NOT EXISTS idx_game_save_paths_game_id ON game_save_paths (game_id);
      
      -- 游戏存档备份表：存储每个游戏的存档备份记录
      CREATE TABLE IF NOT EXISTS game_save_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        backup_name TEXT NOT NULL,
        backup_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      -- 索引，加快按游戏ID和创建时间查询的速度
      CREATE INDEX IF NOT EXISTS idx_game_save_backups_game_id ON game_save_backups (game_id);
      CREATE INDEX IF NOT EXISTS idx_game_save_backups_created_at ON game_save_backups (created_at);
    `);

    // 检查并添加 game_mode 列
    const columns = this.dbInstance.prepare('PRAGMA table_info(game_logs)').all();
    const hasGameModeColumn = columns.some((col: any) => col.name === 'game_mode');

    if (!hasGameModeColumn) {
      this.dbInstance.exec(`
        ALTER TABLE game_logs ADD COLUMN game_mode TEXT DEFAULT 'Normal';
      `);
    }
  }
  //关闭数据库实例
  public static close() {
    if (this.dbInstance?.open) {
      this.dbInstance.close();
    }
  }
}
