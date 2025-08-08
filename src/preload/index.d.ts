import { ElectronAPI } from '@electron-toolkit/preload'
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFile: () => Promise<string>;
      executeFile:(game: { id: number; path: string })=> Promise<{ success: boolean; message?: string }>
      onTimerUpdate: (callback: (elapsedTime: number) => void) => void
      onTimerStopped: (callback: (result: { code: number; finalElapsedTime: number }) => void) => void
      offTimerUpdate:(callback: (elapsedTime: number) => void)=>void
      offTimerStopped:(callback: (result: { code: number; finalElapsedTime: number }) => void)=>void
      // 数据库
      getAllGames: () => Promise<Game[]>;
      addGame: (game: { gameName: string; launchPath: string }) => Promise<Game>;
      deleteGame: (id: number) => Promise<{ changes: number }>;
      getBanners:()=> Promise<Banners[]>;
      addBanner:(gameImage:{gameId:number;imagePath:string;relativePath:string})=>Promise<GameImage>;
      getGameSnapshot:(gameId:number) => Promise<Snapshot[]>
      addGameSnapshot:(gameImage:{gameId:number;imagePath:string;relativePath:string})=>Promise<GameImage>
      delectSnapshot:(id:number)=> Promise<{changes:number}>
      modifyGameName:(id:number,newName:string)=>Promise<void>
      updateGameSize:(id:number,launch_path:string)=>Promise<number>
      //操作本地
      copyImages:(move:{origin:string,target:string,gameName:string,oldFilePath:string}) => Promise<{relativePath:string}>
      delectImages:(relative_path:string)=> Promise<string>
      openFolder:(folderPath:string)=>Promise<void>
    }
  }
}

