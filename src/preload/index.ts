import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
// Custom APIs for renderer
const api = {
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  executeFile: (game: {
    id: number;
    path: string;
    gameMode: string;
  }): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('shell:executeFile', game),
  //监听计时器更新
  onTimerUpdate: (callback: (elapsedTime: number) => void) => {
    ipcRenderer.on('timer:update', (_event, elapsedTime) => {
      callback(elapsedTime);
    });
  },

  //监听计时器停止
  onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => {
    ipcRenderer.on('timer:stopped', (_event, result) => {
      callback(result);
    });
  },
  //移除计时器监听器
  offTimerUpdate: (callback: (_event: any, elapsedTime: number) => void) =>
    ipcRenderer.removeListener('timer:update', callback),
  //移除计时器监听器
  offTimerStopped: (
    callback: (_event: any, result: { code: number; finalElapsedTime: number }) => void,
  ) => ipcRenderer.removeListener('timer:stopped', callback),

  //数据库操作
  getAllGames: () => ipcRenderer.invoke('db:getAllGames'),
  getGamesByCategory: (category: string) => ipcRenderer.invoke('db:getGamesByCategory', category),
  getGameById: (id: number) => ipcRenderer.invoke('db:getGameById', id),
  addGame: (game: { gameName: string; launchPath: string }) =>
    ipcRenderer.invoke('db:addGame', game),
  deleteGame: (id: number) => ipcRenderer.invoke('db:deleteGame', id),
  addBanner: (gameImage: { gameId: number; imagePath: string; relativePath: string }) =>
    ipcRenderer.invoke('db:addBanner', gameImage),
  getBanners: () => ipcRenderer.invoke('db:getBanners'),
  getGameSnapshot: (gameId: number) => ipcRenderer.invoke('db:getSnapshot', gameId),
  addGameSnapshot: (gameImage: { gameId: number; imagePath: string; relativePath: string }) =>
    ipcRenderer.invoke('db:addSnapshot', gameImage),
  delectSnapshot: (id: number) => ipcRenderer.invoke('db:delectSnapshot', id),
  updateSnapshotAlt: (id: number, alt: string) => 
    ipcRenderer.invoke('db:updateSnapshotAlt', id, alt),
  deleteSnapshotAlt: (id: number) => 
    ipcRenderer.invoke('db:deleteSnapshotAlt', id),
  getSnapshotAlt: (id: number) => 
    ipcRenderer.invoke('db:getSnapshotAlt', id),
  modifyGameName: (id: number, newName: string) =>
    ipcRenderer.invoke('db:modifyGameName', id, newName),
  updateGameSize: (id: number, launch_path: string) =>
    ipcRenderer.invoke('db:updateGameSize', id, launch_path),
  updateGamePath: (gameId: number, newPath: string) =>
    ipcRenderer.invoke('db:updateGamePath', gameId, newPath),
  updateGameCategory: (gameId: number, category: string) =>
    ipcRenderer.invoke('db:updateGameCategory', gameId, category),
  searchGames: (keyword: string) => ipcRenderer.invoke('db:searchGames', keyword),
  countGames: () => ipcRenderer.invoke('db:countGames'),
  countGameTime: () => ipcRenderer.invoke('db:countGameTime'),
  countLaunchTimes: () => ipcRenderer.invoke('db:countLaunchTimes'),
  //统计今日 ，本周 ，本月游戏时长
  countDayWeekMonth: () => ipcRenderer.invoke('db:getGameLogDayWeekMonth'),
  //文件操作
  copyImages: (move: { origin: string; target: string; gameName: string; oldFilePath: string }) =>
    ipcRenderer.invoke('op:copyImages', move),
  delectImages: (relative_path: string) => ipcRenderer.invoke('op:delectImages', relative_path),
  openFolder: (folderPath: string) => ipcRenderer.invoke('op:openFolder', folderPath),
  //消息通知
  sendNotification: (title: string, body: string) =>
    ipcRenderer.invoke('op:sendNotification', title, body),
  //切换游戏模式
  setGameMode: (mode: string) => ipcRenderer.invoke('op:setGameMode', mode),
  //打开休息模态框监听器
  onOpenRestTimeModal: (callback: () => void) => {
    ipcRenderer.on('open-rest-time-modal', callback);
  },
  //移除监听器
  offOpenRestTimeModal: () => {
    ipcRenderer.removeAllListeners('open-rest-time-modal');
  },
  //设置休息状态
  setResting: (resting: boolean) => {
    ipcRenderer.invoke('op:setResting', resting);
  },
  //获取4种模式下的游戏时长分布
  getGameLogByMode: () => ipcRenderer.invoke('db:getGameLogByMode'),
  //获取本周的时长分布
  getGameLogByModeThisWeek: () => ipcRenderer.invoke('db:getGameLogByModeThisWeek'),
  //获取上周的时长分布
  getGameLogByModeLastWeek: () => ipcRenderer.invoke('db:getGameLogByModeLastWeek'),
  // 云备份（触发主进程备份数据库）
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  // 备份并上传到远程服务器，参数: uploadUrl, token(可选)
  backupAndUpload: (uploadUrl: string, token?: string) =>
    ipcRenderer.invoke('db:backupAndUpload', uploadUrl, token),
  // 更新游戏版本：gameId, type ('minor'|'major'), summary, fileSize?
  updateGameVersion: (
    gameId: number,
    type: 'minor' | 'major',
    summary: string,
    fileSize?: number,
  ) => ipcRenderer.invoke('db:updateGameVersion', gameId, type, summary, fileSize),
  // 根据版本ID查询版本概述
  getVersionSummary: (versionId: number) => ipcRenderer.invoke('db:getVersionSummary', versionId),
  // 根据游戏ID查询其所有的版本信息
  getVersionsByGame: (gameId: number) => ipcRenderer.invoke('db:getVersionsByGame', gameId),
  // 更新版本描述
  updateVersionDescription: (versionId: number, newDescription: string) =>
    ipcRenderer.invoke('db:updateVersionDescription', versionId, newDescription),
  
  // ==================== 成就相关接口 ====================
  // 创建成就
  createAchievement: (
    gameId: number,
    achievementName: string,
    achievementType: string,
    description?: string,
  ) => ipcRenderer.invoke('db:createAchievement', gameId, achievementName, achievementType, description),
  // 删除成就
  deleteAchievement: (achievementId: number) => 
    ipcRenderer.invoke('db:deleteAchievement', achievementId),
  // 切换成就状态 (0=未完成, 1=已完成)
  toggleAchievementStatus: (achievementId: number, isCompleted: 0 | 1) => 
    ipcRenderer.invoke('db:toggleAchievementStatus', achievementId, isCompleted),
  // 获取游戏所有成就
  getGameAchievements: (gameId: number) => 
    ipcRenderer.invoke('db:getGameAchievements', gameId),
  // 获取已完成的成就
  getCompletedAchievements: (gameId: number) => 
    ipcRenderer.invoke('db:getCompletedAchievements', gameId),
  // 获取未完成的成就
  getUncompletedAchievements: (gameId: number) => 
    ipcRenderer.invoke('db:getUncompletedAchievements', gameId),
  // 获取成就统计
  getAchievementStats: (gameId: number) => 
    ipcRenderer.invoke('db:getAchievementStats', gameId),
  
  // ==================== 外链管理接口 ====================
  // 添加游戏外链
  addGameLink: (gameId: number, metadata: {
    url: string;
    title: string;
    description: string;
    favicon: string;
  }) => ipcRenderer.invoke('db:addGameLink', {
    gameId,
    url: metadata.url,
    title: metadata.title,
    description: metadata.description,
    icon: metadata.favicon,
  }),
  // 获取游戏外链列表
  getGameLinks: (gameId: number) => 
    ipcRenderer.invoke('db:getGameLinks', gameId),
  // 删除游戏外链
  deleteGameLink: (linkId: number) => 
    ipcRenderer.invoke('db:deleteGameLink', linkId),
  // 更新游戏外链
  updateGameLink: (linkId: number, title: string, description: string) => 
    ipcRenderer.invoke('db:updateGameLink', { linkId, title, description }),
  
  // ==================== 窗口控制接口 ====================
  // 最小化窗口
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  // 最大化/还原窗口
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  // 关闭窗口
  closeWindow: () => ipcRenderer.invoke('window:close'),
  // 检查窗口是否最大化
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
