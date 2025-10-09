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
      getGamesByCategory: (category: string) => Promise<Game[]>;
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
      updateSnapshotAlt: (id: number, alt: string) => Promise<void>;
      deleteSnapshotAlt: (id: number) => Promise<void>;
      getSnapshotAlt: (id: number) => Promise<string | null>;
      modifyGameName: (id: number, newName: string) => Promise<void>;
      updateGameSize: (id: number, launch_path: string) => Promise<number>;
      updateGamePath: (gameId: number, newPath: string) => Promise<{ success: boolean; message: string }>;
      updateGameCategory: (gameId: number, category: string) => Promise<{ success: boolean; message: string }>;
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
      backupAndUpload: (
        uploadUrl: string,
        token?: string,
      ) => Promise<{ success: boolean; path?: string; uploadResult?: any; error?: string }>;
      // 更新游戏版本：gameId, type ('minor'|'major'), summary, fileSize?
      updateGameVersion: (
        gameId: number,
        type: 'minor' | 'major',
        summary: string,
        fileSize?: number,
      ) => Promise<any>;
      // 根据版本ID查询版本概述
      getVersionSummary: (
        versionId: number,
      ) => Promise<{
        id: number;
        game_id: number;
        version: string;
        summary: string;
        created_at: number;
      } | null>;
      // 根据游戏ID查询其所有的版本信息
      getVersionsByGame: (
        gameId: number,
      ) => Promise<
        Array<{
          id: number;
          game_id: number;
          version: string;
          summary: string;
          file_size?: number;
          created_at: number;
        }>
      >;
      // 更新版本描述
      updateVersionDescription: (
        versionId: number,
        newDescription: string,
      ) => Promise<{ success: boolean; message: string }>;
      
      // ==================== 成就相关接口 ====================
      // 创建成就
      createAchievement: (
        gameId: number,
        achievementName: string,
        achievementType: string,
        description?: string,
      ) => Promise<{
        id: number;
        gameId: number;
        achievementName: string;
        achievementType: string;
        description?: string;
        isCompleted: 0;
      }>;
      // 删除成就
      deleteAchievement: (achievementId: number) => Promise<void>;
      // 切换成就状态
      toggleAchievementStatus: (achievementId: number, isCompleted: 0 | 1) => Promise<void>;
      // 获取游戏所有成就
      getGameAchievements: (gameId: number) => Promise<GameAchievement[]>;
      // 获取已完成的成就
      getCompletedAchievements: (gameId: number) => Promise<GameAchievement[]>;
      // 获取未完成的成就
      getUncompletedAchievements: (gameId: number) => Promise<GameAchievement[]>;
      // 获取成就统计
      getAchievementStats: (gameId: number) => Promise<{
        total: number;
        completed: number;
        completionRate: number;
      }>;
      
      // ==================== 外链管理接口 ====================
      // 添加游戏外链
      addGameLink: (gameId: number, metadata: {
        url: string;
        title: string;
        description: string;
        favicon: string;
      }) => Promise<any>;
      // 获取游戏外链列表
      getGameLinks: (gameId: number) => Promise<Array<{
        id: number;
        game_id: number;
        url: string;
        title: string;
        description: string;
        icon: string;
        created_at: number;
        updated_at: number;
      }>>;
      // 删除游戏外链
      deleteGameLink: (linkId: number) => Promise<any>;
      // 更新游戏外链
      updateGameLink: (linkId: number, title: string, description: string) => Promise<any>;
      
      // ==================== 窗口控制接口 ====================
      // 最小化窗口
      minimizeWindow: () => Promise<void>;
      // 最大化/还原窗口
      maximizeWindow: () => Promise<void>;
      // 关闭窗口
      closeWindow: () => Promise<void>;
      // 检查窗口是否最大化
      isWindowMaximized: () => Promise<boolean>;
    };
  }
}
