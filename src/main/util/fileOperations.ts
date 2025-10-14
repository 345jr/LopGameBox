import * as fs from 'fs/promises';
import path from 'path';

/**
 * 递归复制目录
 * @param src 源目录路径
 * @param dest 目标目录路径
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
  // 创建目标目录
  await fs.mkdir(dest, { recursive: true });

  // 读取源目录内容
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 递归复制子目录
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      // 复制文件
      await fs.copyFile(srcPath, destPath);
    }
    // 跳过符号链接
  }
}
