import path from 'path';
import * as fs from 'fs/promises';
async function calculateDirectorySizeAsync(filePath) {
  const dirPath = path.dirname(filePath);

  async function dfs(dir, visitedInodes = new Set()) {
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
          totalSize += await dfs(fullPath, visitedInodes);
        }
      }
    } catch (err) {
      // 忽略权限错误
      if (err.code === 'EACCES') return 0;
      throw err;
    }
    return totalSize;
  }

  return dfs(dirPath);
}

// 使用
calculateDirectorySizeAsync(
  'C:\\Galgame\\game-box\\kakenuke_R18\\kakenuke.exe',
).then((size) => console.log(size));
