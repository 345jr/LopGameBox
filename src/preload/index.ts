import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
// Custom APIs for renderer
const api = {
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  executeFile: (game: {
    id: number;
    path: string;
  }): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('shell:executeFile', game),
  //监听计时器更新
  onTimerUpdate: (callback: (elapsedTime: number) => void) => {
    ipcRenderer.on('timer:update', (_event, elapsedTime) => {
      callback(elapsedTime);
    });
  },

  //监听计时器停止
  onTimerStopped: (
    callback: (result: { code: number; finalElapsedTime: number }) => void,
  ) => {
    ipcRenderer.on('timer:stopped', (_event, result) => {
      callback(result);
    });
  },
  //移除计时器监听器
  offTimerUpdate: (callback: (_event: any, elapsedTime: number) => void) =>
    ipcRenderer.removeListener('timer:update', callback),
  //移除计时器监听器
  offTimerStopped: (
    callback: (
      _event: any,
      result: { code: number; finalElapsedTime: number },
    ) => void,
  ) => ipcRenderer.removeListener('timer:stopped', callback),

  //数据库操作
  getAllGames: () => ipcRenderer.invoke('db:getAllGames'),
  getGameById: (id: number) => ipcRenderer.invoke('db:getGameById', id),
  addGame: (game: { gameName: string; launchPath: string }) =>
    ipcRenderer.invoke('db:addGame', game),
  deleteGame: (id: number) => ipcRenderer.invoke('db:deleteGame', id),
  addBanner: (gameImage: {
    gameId: number;
    imagePath: string;
    relativePath: string;
  }) => ipcRenderer.invoke('db:addBanner', gameImage),
  getBanners: () => ipcRenderer.invoke('db:getBanners'),
  getGameSnapshot: (gameId: number) =>
    ipcRenderer.invoke('db:getSnapshot', gameId),
  addGameSnapshot: (gameImage: {
    gameId: number;
    imagePath: string;
    relativePath: string;
  }) => ipcRenderer.invoke('db:addSnapshot', gameImage),
  delectSnapshot: (id: number) => ipcRenderer.invoke('db:delectSnapshot', id),
  modifyGameName: (id: number, newName: string) =>ipcRenderer.invoke('db:modifyGameName', id, newName),
  updateGameSize: (id: number, launch_path:string) => ipcRenderer.invoke('db:updateGameSize', id, launch_path),
  searchGames: (keyword: string) => ipcRenderer.invoke('db:searchGames', keyword),
  countGames: () => ipcRenderer.invoke('db:countGames'),
  countGameTime: () => ipcRenderer.invoke('db:countGameTime'),
  countLaunchTimes: () => ipcRenderer.invoke('db:countLaunchTimes'),
  countDayWeekMonth: () => ipcRenderer.invoke('db:getGameLogDayWeekMonth'),
  //文件操作
  copyImages: (move: {
    origin: string;
    target: string;
    gameName: string;
    oldFilePath: string;
  }) => ipcRenderer.invoke('op:copyImages', move),
  delectImages: (relative_path: string) =>
    ipcRenderer.invoke('op:delectImages', relative_path),
  openFolder: (folderPath: string) => ipcRenderer.invoke('op:openFolder', folderPath)
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
