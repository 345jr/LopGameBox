import { existsSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { Utils } from 'electrobun/bun'

/** Walk up from several roots looking for a file (e.g. repo db). */
function findExistingFile(relativePath: string): string | null {
  const starts = [
    process.cwd(),
    typeof import.meta.dir === 'string' ? import.meta.dir : '',
    join(process.cwd(), '..', '..', '..', '..'),
    join(process.cwd(), '..', '..', '..')
  ].filter(Boolean)

  const seen = new Set<string>()
  for (const start of starts) {
    let dir = resolve(start)
    for (let i = 0; i < 12; i++) {
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

export function findRepoRoot(): string | null {
  const pkg = findExistingFile('package.json')
  return pkg ? dirname(pkg) : null
}

/**
 * Stable user data dir — match Electron's `%APPDATA%/lopbox` so existing
 * banners / uploads keep working after migration.
 */
export function getUserDataPath(): string {
  if (process.platform === 'win32' && process.env.APPDATA) {
    const p = join(process.env.APPDATA, 'lopbox')
    mkdirSync(p, { recursive: true })
    return p
  }
  if (process.platform === 'darwin') {
    const p = join(Utils.paths.home, 'Library', 'Application Support', 'lopbox')
    mkdirSync(p, { recursive: true })
    return p
  }
  const p = join(Utils.paths.home, '.config', 'lopbox')
  mkdirSync(p, { recursive: true })
  return p
}

export function getDbPath(): string {
  const projectDb = findExistingFile(join('db', 'gameData.db'))
  if (projectDb) return projectDb

  const userData = getUserDataPath()
  return join(userData, 'gameData.db')
}

export function getTempPath(): string {
  return Utils.paths.temp
}

export function getSaveBackupsDir(): string {
  const root = findRepoRoot()
  if (root) return join(root, 'saveBackups')
  return join(getUserDataPath(), 'saveBackups')
}

export function getScreenshotsDir(): string {
  const root = findRepoRoot()
  if (root) return join(root, 'screenshots')
  return join(getUserDataPath(), 'screenshots')
}

export function getDeletePath(oldFilePath: string): string {
  if (oldFilePath === 'banner\\default.jpg' || oldFilePath === 'banner/default.jpg') {
    return 'skip'
  }
  if (oldFilePath === 'skip') return 'skip'
  const rel = oldFilePath.replace(/\\/g, '/').replace(/^\/+/, '')
  return join(getUserDataPath(), rel)
}

export function isDevBuild(): boolean {
  return (
    process.env.ELECTROBUN_BUILD_ENV === 'dev' ||
    process.env.ELECTROBUN_BUILD_ENV === undefined ||
    process.env.ELECTROBUN_BUILD_ENV === ''
  )
}
