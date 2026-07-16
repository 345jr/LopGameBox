import { DatabaseManager } from './databaseManager'
import path from 'path'
import { app } from 'electron'
import * as fs from 'fs'

export class BackupService {
  private db = DatabaseManager.getInstance()

  /** 本地备份数据库，返回备份文件路径 */
  public async backupDatabase(): Promise<string> {
    const baseDir = app.isPackaged ? app.getPath('userData') : path.join(process.cwd(), 'db')

    const backupDir = path.join(baseDir, 'backups')

    try {
      fs.mkdirSync(backupDir, { recursive: true })
    } catch (err) {
      console.log('创建备份目录失败:', err)
    }

    const backupPath = path.join(backupDir, `backup-${Date.now()}.db`)

    try {
      await this.db.backup(backupPath)
      console.log('数据库备份成功:', backupPath)
      return backupPath
    } catch (err) {
      console.error('数据库备份失败:', err)
      throw err
    }
  }
}
