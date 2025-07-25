import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFile: () => Promise<string>;
      executeFile:(game: { id: number; path: string })=> Promise<{ success: boolean; message?: string }>
      onTimerUpdate: (callback: (elapsedTime: number) => void) => void
      onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => void
      // 数据库
      getAllGames: () => Promise<Game[]>;
      addGame: (game: { gameName: string; launchPath: string }) => Promise<Game>;
      deleteGame: (id: number) => Promise<{ changes: number }>;
    }
  }
}

