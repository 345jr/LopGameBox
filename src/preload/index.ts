import { contextBridge,ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  executeFile:(game:{id:number;path:string}): Promise<{ success: boolean; message?: string }> => ipcRenderer.invoke('shell:executeFile', game),
  //监听计时器更新
  onTimerUpdate: (callback: (elapsedTime: number) => void) => {
    ipcRenderer.on('timer:update', (_event, elapsedTime) => {
      callback(elapsedTime)
    })
  },
  
  //监听计时器停止
  onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => {
    ipcRenderer.on('timer:stopped', (_event, result) => {
      callback(result)
    })
  },
  //数据库操作
  getAllGames: () => ipcRenderer.invoke('db:getAllGames'),
  addGame: (game: { gameName: string; launchPath: string }) => ipcRenderer.invoke('db:addGame', game),
  deleteGame: (id: number) => ipcRenderer.invoke('db:deleteGame', id),
  addBanner:(gameImage:{gameId:number;imagePath:string;relativePath:string}) =>ipcRenderer.invoke('db:addBanner',gameImage),
  getBanners: ()=>ipcRenderer.invoke('db:getBanners'),
  //文件操作
  copyImages:(move:{origin:string,target:string,gameName:string}) => ipcRenderer.invoke('op:copyImages',move)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
