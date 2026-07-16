import { DatabaseManager } from '../db/databaseManager'
import path from 'path'
import * as fs from 'fs'
import { findRepoRoot, getUserDataPath } from '../paths'

export class BackupService {
  /** 本地备份数据库，返回备份文件路径 */
  public async backupDatabase(): Promise<string> {
    const root = findRepoRoot()
    const baseDir = root ? path.join(root, 'db') : getUserDataPath()
    const backupDir = path.join(baseDir, 'backups')

    try {
      fs.mkdirSync(backupDir, { recursive: true })
    } catch (err) {
      console.error('[Backup] failed to create directory:', err)
    }

    const backupPath = path.join(backupDir, `backup-${Date.now()}.db`)

    try {
      DatabaseManager.backupTo(backupPath)
      console.log('[Backup] database saved:', backupPath)
      return backupPath
    } catch (err) {
      console.error('[Backup] database failed:', err)
      throw err
    }
  }
}
