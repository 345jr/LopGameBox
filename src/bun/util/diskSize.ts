import * as fs from 'fs/promises'
import path from 'path'

async function getDirectorySizeAsync(
  dir: string,
  visitedInodes: Set<number> = new Set()
): Promise<number> {
  let totalSize = 0
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) continue
      const stat = await fs.lstat(fullPath)
      if (stat.isFile()) {
        if (!visitedInodes.has(stat.ino)) {
          totalSize += stat.size
          visitedInodes.add(stat.ino)
        }
      } else if (stat.isDirectory()) {
        totalSize += await getDirectorySizeAsync(fullPath, visitedInodes)
      }
    }
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'EACCES') return 0
    throw err
  }
  return totalSize
}

export async function getSize(filePath: string): Promise<number> {
  return getDirectorySizeAsync(path.dirname(filePath))
}

export async function getFolderSize(folderPath: string): Promise<number> {
  return getDirectorySizeAsync(folderPath)
}
