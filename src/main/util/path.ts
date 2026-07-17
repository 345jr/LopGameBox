import path from 'path'
import { app } from 'electron'

/**
 * 游戏使用的默认封面标记路径（banner/default.jpg）。
 * 实际图片在 defaultBanners/ 下由设置中心管理，替换游戏封面时不可误删标记。
 */
export const isDefaultBannerRel = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase()
  return normalized === 'banner/default.jpg'
}

// 处理需要删除的旧封面图路径——仅使用 userData
export const getDelectPath = (oldFilePath: string): string => {
  if (oldFilePath === 'skip' || isDefaultBannerRel(oldFilePath)) {
    if (isDefaultBannerRel(oldFilePath)) {
      console.log('[Path] skip default banner')
    }
    return 'skip'
  }

  // 规范相对路径
  const rel = oldFilePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const userDataPath = path.join(app.getPath('userData'), rel)
  return userDataPath
}
