import { ElectronAPI } from '@electron-toolkit/preload';
declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      openFile: () => Promise<string>;
      executeFile: (game: {
        id: number;
        path: string;
        gameMode: string;
      }) => Promise<{ success: boolean; message?: string }>;
      onTimerUpdate: (callback: (elapsedTime: number) => void) => void;
      onTimerStopped: (
        callback: (result: { code: number; finalElapsedTime: number }) => void,
      ) => void;
      offTimerUpdate: (callback: (elapsedTime: number) => void) => void;
      offTimerStopped: (
        callback: (result: { code: number; finalElapsedTime: number }) => void,
      ) => void;
      // 数据库
      getAllGames: () => Promise<Game[]>;
      getGameById: (id: number) => Promise<Game>;
      addGame: (game: { gameName: string; launchPath: string }) => Promise<Game>;
      deleteGame: (id: number) => Promise<{ changes: number }>;
      getBanners: () => Promise<Banners[]>;
      addBanner: (gameImage: {
        gameId: number;
        imagePath: string;
        relativePath: string;
      }) => Promise<GameImage>;
      getGameSnapshot: (gameId: number) => Promise<Snapshot[]>;
      addGameSnapshot: (gameImage: {
        gameId: number;
        imagePath: string;
        relativePath: string;
      }) => Promise<GameImage>;
      delectSnapshot: (id: number) => Promise<{ changes: number }>;
      modifyGameName: (id: number, newName: string) => Promise<void>;
      updateGameSize: (id: number, launch_path: string) => Promise<number>;
      searchGames: (keyword: string) => Promise<Game[]>;
      countGames: () => Promise<{ count: number }>;
      countGameTime: () => Promise<{ timeCount: number }>;
      countLaunchTimes: () => Promise<{ launchCount: number }>;
      countDayWeekMonth: () => Promise<{
        todayHours: number;
        weekHours: number;
        monthHours: number;
      }>;
      //操作本地
      copyImages: (move: {
        origin: string;
        target: string;
        gameName: string;
        oldFilePath: string;
      }) => Promise<{ relativePath: string }>;
      delectImages: (relative_path: string) => Promise<string>;
      openFolder: (folderPath: string) => Promise<void>;
      //消息通知
      sendNotification: (title: string, body: string) => Promise<void>;
      //切换游戏模式
      setGameMode: (mode: string) => Promise<void>;
      //打开休息模态框
      onOpenRestTimeModal: (callback: () => void) => Promise<void>;
      offOpenRestTimeModal: () => Promise<void>;
      //设置休息状态
      setResting: (resting: boolean) => Promise<void>;
      //获取4种模式下的游戏时长分布
      getGameLogByMode: () => Promise<{
        normalHours: number;
        fastHours: number;
        afkHours: number;
        infinityHours: number;
      }>;
      //获取本周的时长分布
      getGameLogByModeThisWeek: () => Promise<GameLog[]>;
      //获取上周的时长分布
      getGameLogByModeLastWeek: () => Promise<GameLog[]>;
      // 云备份
      backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>;
      // 备份并上传到远端
      backupAndUpload: (uploadUrl: string, token?: string) => Promise<{ success: boolean; path?: string; uploadResult?: any; error?: string }>;
  // 更新游戏版本：gameId, type ('minor'|'major'), summary, fileSize?
  updateGameVersion: (gameId: number, type: 'minor' | 'major', summary: string, fileSize?: number) => Promise<any>;
  // 根据版本ID查询版本概述
  getVersionSummary: (versionId: number) => Promise<{ id: number; game_id: number; version: string; summary: string; created_at: number } | null>;
    };
  }
}
