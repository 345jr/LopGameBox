import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { getDbPath } from '../paths'

export type RunResult = {
  changes: number
  lastInsertRowid: number | bigint
}

/**
 * Thin wrapper so existing repository code that used better-sqlite3
 * (prepare → run/get/all) keeps working on bun:sqlite.
 */
export class Statement {
  constructor(private stmt: ReturnType<Database['prepare']>) {}

  run(...params: unknown[]): RunResult {
    const result = this.stmt.run(...(params as never[]))
    return {
      changes: Number(result.changes ?? 0),
      lastInsertRowid: result.lastInsertRowid as number | bigint
    }
  }

  get(...params: unknown[]): unknown {
    return this.stmt.get(...(params as never[]))
  }

  all(...params: unknown[]): unknown[] {
    return this.stmt.all(...(params as never[])) as unknown[]
  }
}

export type AppDatabase = {
  prepare: (sql: string) => Statement
  exec: (sql: string) => void
}

export class DatabaseManager {
  private static raw: Database | null = null
  private static facade: AppDatabase | null = null
  private static dbPath = ''

  public static getPath(): string {
    return this.dbPath || getDbPath()
  }

  private static ensureRaw(): Database {
    if (!this.raw) {
      this.dbPath = getDbPath()
      const dir = dirname(this.dbPath)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      console.log('[DB] path:', this.dbPath)
      this.raw = new Database(this.dbPath, { create: true })
      this.raw.exec('PRAGMA foreign_keys = ON')
      this.initSchema(this.raw)
    }
    return this.raw
  }

  /** better-sqlite3-compatible facade used by repositories */
  public static getInstance(): AppDatabase {
    if (!this.facade) {
      const raw = this.ensureRaw()
      this.facade = {
        prepare: (sql: string) => new Statement(raw.prepare(sql)),
        exec: (sql: string) => {
          raw.exec(sql)
        }
      }
    }
    return this.facade
  }

  public static backupTo(destPath: string): void {
    const db = this.ensureRaw()
    const escaped = destPath.replace(/'/g, "''")
    db.exec(`VACUUM INTO '${escaped}'`)
  }

  public static close(): void {
    if (this.raw) {
      this.raw.close()
      this.raw = null
      this.facade = null
    }
  }

  private static initSchema(db: Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_name TEXT NOT NULL,
        launch_path TEXT NOT NULL UNIQUE,
        total_play_time INTEGER DEFAULT 0,
        last_launch_time INTEGER,
        launch_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        disk_size INTEGER DEFAULT 0,
        game_version TEXT NOT NULL DEFAULT '1.0',
        category TEXT DEFAULT 'all'
      );
      CREATE TABLE IF NOT EXISTS game_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        image_type TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        relative_path TEXT NOT NULL,
        alt TEXT,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS game_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        play_time INTEGER NOT NULL,
        launched_at INTEGER NOT NULL,
        ended_at INTEGER,
        launch_state TEXT NOT NULL,
        game_mode TEXT DEFAULT 'Normal',
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_game_logs_launched_at ON game_logs (launched_at);
      CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs (game_id);
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
      CREATE UNIQUE INDEX IF NOT EXISTS idx_game_versions_gameid_version ON game_versions (game_id, version);
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
      CREATE INDEX IF NOT EXISTS idx_game_achievements_game_id ON game_achievements (game_id);
      CREATE INDEX IF NOT EXISTS idx_game_achievements_completed ON game_achievements (is_completed);
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
      CREATE UNIQUE INDEX IF NOT EXISTS idx_game_links_gameid_url ON game_links (game_id, url);
      CREATE INDEX IF NOT EXISTS idx_game_links_game_id ON game_links (game_id);
      CREATE TABLE IF NOT EXISTS game_save_paths (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL UNIQUE,
        save_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_game_save_paths_game_id ON game_save_paths (game_id);
      CREATE TABLE IF NOT EXISTS game_save_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        backup_name TEXT NOT NULL,
        backup_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_game_save_backups_game_id ON game_save_backups (game_id);
      CREATE INDEX IF NOT EXISTS idx_game_save_backups_created_at ON game_save_backups (created_at);
    `)

    const columns = db.prepare('PRAGMA table_info(game_logs)').all() as { name: string }[]
    if (!columns.some((c) => c.name === 'game_mode')) {
      db.exec(`ALTER TABLE game_logs ADD COLUMN game_mode TEXT DEFAULT 'Normal'`)
    }
  }
}
