import * as fs from 'fs/promises';
import path from 'path';

export async function getSize(filePath:string) {
  const dirPath = path.dirname(filePath);

  async function getDirectorySizeAsync(dir:string, visitedInodes = new Set()) {
    let totalSize = 0;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // 跳过符号链接
        if (entry.isSymbolicLink()) continue;

        const stat = await fs.lstat(fullPath);

        if (stat.isFile()) {
          if (!visitedInodes.has(stat.ino)) {
            totalSize += stat.size;
            visitedInodes.add(stat.ino);
          }
        } else if (stat.isDirectory()) {
          // 是文件夹触发递归
          totalSize += await getDirectorySizeAsync(fullPath, visitedInodes);
        }
      }
    } catch (err:unknown) {
      // 忽略权限错误
      if ((err as { code?: string }).code === 'EACCES') return 0;
      throw err;
    }
    return totalSize;
  }

  return getDirectorySizeAsync(dirPath);
}


