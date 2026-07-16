import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { Utils } from 'electrobun/bun'
import type { BannerDTO, GameRowDTO } from '../shared/rpc'

let db: Database | null = null
let resolvedDbPath = ''

/**
 * Electrobun dev sets cwd to build/.../bin, so walk up from several roots
 * to find the repo `db/gameData.db` used by the Electron app.
 */
function findExistingFile(relativePath: string): string | null {
  const starts = [
    process.cwd(),
    // import.meta.dir is typically Resources/ or Resources/app/bun after bundle
    typeof import.meta.dir === 'string' ? import.meta.dir : '',
    // common relative jumps from build/dev-win-x64/LopBox-dev/bin → repo root
    join(process.cwd(), '..', '..', '..', '..'),
    join(process.cwd(), '..', '..', '..')
  ].filter(Boolean)

  const seen = new Set<string>()
  for (const start of starts) {
    let dir = resolve(start)
    for (let i = 0; i < 10; i++) {
      if (seen.has(dir)) break
      seen.add(dir)
      const candidate = join(dir, relativePath)
      if (existsSync(candidate)) return candidate
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  return null
}

export function getDbPath(): string {
  if (resolvedDbPath) return resolvedDbPath

  const projectDb = findExistingFile(join('db', 'gameData.db'))
  if (projectDb) {
    resolvedDbPath = projectDb
    return resolvedDbPath
  }

  const userData = Utils.paths.userData
  mkdirSync(userData, { recursive: true })
  resolvedDbPath = join(userData, 'gameData.db')
  return resolvedDbPath
}

export function getDb(): Database {
  if (db) return db

  const path = getDbPath()
  console.log('[DB] opening:', path)
  db = new Database(path, { create: true })
  db.exec('PRAGMA foreign_keys = ON')
  ensureSchema(db)
  return db
}

function ensureSchema(database: Database): void {
  database.exec(`
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
  `)
}

export function getAllGames(): GameRowDTO[] {
  return getDb()
    .query(
      `SELECT * FROM games ORDER BY last_launch_time DESC, created_at DESC`
    )
    .all() as GameRowDTO[]
}

export function getGamesByCategory(category: string): GameRowDTO[] {
  if (!category || category.toLowerCase() === 'all') {
    return getAllGames()
  }
  return getDb()
    .query(
      `SELECT * FROM games WHERE category = ? ORDER BY last_launch_time DESC, created_at DESC`
    )
    .all(category) as GameRowDTO[]
}

export function searchGames(keyword: string): GameRowDTO[] {
  const q = `%${keyword}%`
  return getDb()
    .query(
      `SELECT * FROM games WHERE game_name LIKE ? ORDER BY last_launch_time DESC, created_at DESC`
    )
    .all(q) as GameRowDTO[]
}

export function getGameById(id: number): GameRowDTO | null {
  const row = getDb().query(`SELECT * FROM games WHERE id = ?`).get(id) as
    | GameRowDTO
    | undefined
  return row ?? null
}

export function getBanners(assetBaseUrl: string): BannerDTO[] {
  const rows = getDb()
    .query(
      `SELECT * FROM game_gallery WHERE image_type = 'banner' ORDER BY created_at DESC`
    )
    .all() as Array<{
    id: number
    game_id: number
    image_path: string
    image_type: string
    created_at: number
    relative_path: string
  }>

  return rows.map((row) => {
    const rel = (row.relative_path || '').replace(/\\/g, '/').replace(/^\/+/, '')
    const url =
      rel && rel !== 'banner/default.jpg' && rel !== 'banner\\default.jpg'
        ? `${assetBaseUrl}/${rel}`
        : null
    return { ...row, url }
  })
}

export function countGames(): number {
  const row = getDb().query(`SELECT COUNT(*) as c FROM games`).get() as { c: number }
  return row?.c ?? 0
}

/** Directory used for user-uploaded gallery assets (mirrors Electron userData). */
export function getUserAssetsDir(): string {
  // Prefer existing Electron app userData so banners show in the experiment.
  const electronCandidates = [
    join(process.env.APPDATA || '', 'lopbox'),
    join(process.env.APPDATA || '', 'lopgamebox'),
    join(process.env.LOCALAPPDATA || '', 'lopbox')
  ]
  for (const candidate of electronCandidates) {
    if (candidate && existsSync(candidate)) return candidate
  }

  const projectUserData = findExistingFile(join('userData', 'gameData.db'))
  if (projectUserData) return dirname(projectUserData)

  // Walk up for a project-level userData/ folder
  let dir = resolve(process.cwd())
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'userData')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return Utils.paths.userData
}
