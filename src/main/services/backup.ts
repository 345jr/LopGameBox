import { DatabaseManager } from './databaseManager';
import path from 'path';
import { app } from 'electron';
import * as fs from 'fs';
import fsPromises from 'fs/promises';

export class BackupService {
  private db = DatabaseManager.getInstance();

  // 备份数据库（最小实现，等待完成并返回路径）
  public async backupDatabase(): Promise<string> {
    const baseDir = app.isPackaged ? path.dirname(app.getPath('exe')) : process.cwd();
    const backupDir = path.join(baseDir, 'db', 'backups');
    // 确保目录存在
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (err) {
      console.log('创建备份目录失败:', err);
    }
    const backupPath = path.join(backupDir, `backup-${Date.now()}.db`);
    try {
      await (this.db as any).backup(backupPath);
      return backupPath;
    } catch (err) {
      console.error('数据库备份失败:', err);
      throw err;
    }
  }

  // 简单上传备份文件（读取整个文件并 POST 到服务器）
  public async uploadBackup(backupPath: string, uploadUrl: string, token?: string) {
    try {
      const data = await fsPromises.readFile(backupPath);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': path.basename(backupPath),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new Uint8Array(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`upload failed: ${res.status} ${text}`);
      }
      // 解析返回（假设 JSON，可按需调整）
      const json = await res.json().catch(() => null);
      // return { status: res.status, body: json ?? (await res.text()) };
      return json;
    } catch (err) {
      console.error('上传备份失败:', err);
      throw err;
    }
  }
}
