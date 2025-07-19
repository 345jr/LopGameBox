import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFile: () => Promise<string>;
      executeFile:(filePath:string)=> Promise<{ success: boolean; message?: string }>
      onTimerUpdate: (callback: (elapsedTime: number) => void) => void
      onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => void
    }
  }
}

