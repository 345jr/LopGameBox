import type { IpcContext } from './types'
import { registerDialogIpc } from './dialog.ipc'
import { registerGameSessionIpc } from './gameSession.ipc'
import { registerGamesIpc } from './games.ipc'
import { registerGalleryIpc } from './gallery.ipc'
import { registerLinksIpc } from './links.ipc'
import { registerAchievementsIpc } from './achievements.ipc'
import { registerStatsIpc } from './stats.ipc'
import { registerSavesIpc } from './saves.ipc'
import { registerWindowIpc } from './window.ipc'
import { registerFilesIpc } from './files.ipc'
import { registerScreenshotIpc } from './screenshot.ipc'
import { registerSettingsIpc } from './settings.ipc'

/** 注册全部主进程 IPC；按域拆分，新增接口时改对应文件 */
export function registerAllIpc(ctx: IpcContext): void {
  registerDialogIpc()
  registerFilesIpc()
  registerGameSessionIpc(ctx)
  registerGamesIpc(ctx)
  registerGalleryIpc(ctx)
  registerLinksIpc(ctx)
  registerAchievementsIpc(ctx)
  registerStatsIpc(ctx)
  registerSavesIpc(ctx)
  registerWindowIpc(ctx)
  registerScreenshotIpc(ctx)
  registerSettingsIpc()
}
