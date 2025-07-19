import { contextBridge,ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  executeFile:(filePath:string): Promise<{ success: boolean; message?: string }> => ipcRenderer.invoke('shell:executeFile', filePath),
  // ✨ 新增：监听计时器更新
  // callback 是一个函数，当主进程发来 'timer:update' 消息时会被调用
  onTimerUpdate: (callback: (elapsedTime: number) => void) => {
    ipcRenderer.on('timer:update', (_event, elapsedTime) => {
      callback(elapsedTime)
    })
  },
  
  // ✨ 新增：监听计时器停止
  onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => {
    ipcRenderer.on('timer:stopped', (_event, result) => {
      callback(result)
    })
  }
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
