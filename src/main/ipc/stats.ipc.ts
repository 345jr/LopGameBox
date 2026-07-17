import { ipcMain } from 'electron'
import type { IpcContext } from './types'

export function registerStatsIpc({ gameService }: IpcContext): void {
  ipcMain.handle('db:countGames', () => gameService.countGames())
  ipcMain.handle('db:countGameTime', () => gameService.countGameTime())
  ipcMain.handle('db:countLaunchTimes', () => gameService.countLaunchTimes())
  ipcMain.handle('db:getGameLogDayWeekMonth', () => gameService.getGameLogDayWeekMonth())
  ipcMain.handle('db:getGameLogByMode', () => gameService.getGameLogByMode())
  ipcMain.handle('db:getGameLogByModeThisWeek', () => gameService.getGameLogByModeThisWeek())
  ipcMain.handle('db:getGameLogByModeLastWeek', () => gameService.getGameLogByModeLastWeek())
}
