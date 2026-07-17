import { app, ipcMain, shell } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { getFolderSize } from '../util/diskSize'
import { getDelectPath } from '../util/path'
import { errorMessage } from '../util/errorMessage'
import type { DropFilePayload, TempDropPayload } from '../types/rows'

export function registerFilesIpc(): void {
  ipcMain.handle('util:getFolderSize', async (_event, folderPath: string) => {
    try {
      return await getFolderSize(folderPath)
    } catch (error: unknown) {
      console.error('[Size] get folder size failed:', errorMessage(error))
      return 0
    }
  })

  ipcMain.handle('op:copyImages', async (_event, { origin, target, gameName, oldFilePath }) => {
    try {
      const time = Date.now()
      const ext = path.extname(origin) || '.jpg'
      const gameNameExtension = `${gameName}-${time}${ext}`.replace(/\s/g, '')
      const targetDir = path.join(app.getPath('userData'), target)

      await fs.mkdir(targetDir, { recursive: true })

      const imageName = path.join(targetDir, gameNameExtension)
      const filePath = getDelectPath(oldFilePath) as string
      if (filePath !== 'skip') {
        try {
          await fs.unlink(filePath)
        } catch (err: unknown) {
          const code =
            typeof err === 'object' && err !== null && 'code' in err
              ? String((err as { code?: unknown }).code)
              : undefined
          if (code && code !== 'ENOENT') {
            console.warn('[Banner] non-fatal delete old cover:', errorMessage(err))
          }
        }
      }
      await fs.copyFile(origin, imageName)
      console.log('[File] copy success')
      const relativePath = path.posix.join(target.replace(/\\+/g, '/'), gameNameExtension)
      return { relativePath }
    } catch (error: unknown) {
      console.error('[File] copy failed:', error)
      const defaultRel = path.posix.join(target.replace(/\\+/g, '/'), 'default.jpg')
      return { relativePath: defaultRel }
    }
  })

  ipcMain.handle('op:getTempDrop', async (_event, payload: TempDropPayload) => {
    try {
      const files: DropFilePayload[] = payload?.files || []
      for (const f of files) {
        if (f.buffer) {
          try {
            const tempDir = app.getPath('temp')
            const fileName = `临时图片-${Date.now()}-${(f.name || 'file').replace(/[^a-zA-Z0-9_.-]/g, '_')}`
            const dest = path.join(tempDir, fileName)
            await fs.writeFile(dest, Buffer.from(f.buffer as Uint8Array))
            return { success: true, tempPath: dest }
          } catch (err: unknown) {
            return { success: false, error: errorMessage(err) }
          }
        } else {
          console.warn('[Clipboard] no image buffer available')
          return { success: false, error: '没有可用的路径或缓冲区' }
        }
      }
      return { success: false, error: '没有处理的文件' }
    } catch (err: unknown) {
      return { success: false, error: errorMessage(err) }
    }
  })

  ipcMain.handle('op:delectImages', async (_event, relative_path) => {
    try {
      const filePath = getDelectPath(relative_path)
      await fs.unlink(filePath)
      console.log('[File] deleted')
    } catch (error: unknown) {
      console.error('[File] delete failed:', errorMessage(error))
    }
  })

  ipcMain.handle('op:openFolder', (_event, folderPath) => {
    try {
      shell.showItemInFolder(folderPath)
    } catch (error: unknown) {
      console.error('[Folder] open failed:', errorMessage(error))
    }
  })
}
