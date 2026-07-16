import type { DropPayload, DropResult } from './IPCtype'

declare global {
  interface Window {
    api: {
      openFile: () => Promise<string>
      selectFolder: () => Promise<string | null>
      executeFile: (game: {
        id: number
        path: string
        gameMode: string
      }) => Promise<{ success: boolean; message?: string }>
      onTimerUpdate: (callback: (elapsedTime: number) => void) => void
      onTimerStopped: (
        callback: (result: { code: number; finalElapsedTime: number }) => void
      ) => void
      offTimerUpdate: (callback: (elapsedTime: number) => void) => void
      offTimerStopped: (
        callback: (result: { code: number; finalElapsedTime: number }) => void
      ) => void
      getAllGames: () => Promise<Game[]>
      getGamesByCategory: (category: string) => Promise<Game[]>
      getGameById: (id: number) => Promise<Game>
      addGame: (game: { gameName: string; launchPath: string }) => Promise<Game>
      deleteGame: (id: number) => Promise<{ changes: number }>
      getBanners: () => Promise<Banners[]>
      addBanner: (gameImage: {
        gameId: number
        imagePath: string
        relativePath: string
      }) => Promise<GameImage>
      getGameSnapshot: (gameId: number, newestFirst?: boolean) => Promise<Snapshot[]>
      addGameSnapshot: (gameImage: {
        gameId: number
        imagePath: string
        relativePath: string
      }) => Promise<GameImage>
      delectSnapshot: (id: number) => Promise<{ changes: number }>
      updateSnapshotAlt: (id: number, alt: string) => Promise<void>
      deleteSnapshotAlt: (id: number) => Promise<void>
      getSnapshotAlt: (id: number) => Promise<string | null>
      modifyGameName: (id: number, newName: string) => Promise<void>
      updateGameSize: (id: number, launch_path: string) => Promise<number>
      getFolderSize: (folderPath: string) => Promise<number>
      updateGamePath: (
        gameId: number,
        newPath: string
      ) => Promise<{ success: boolean; message: string }>
      updateGameCategory: (
        gameId: number,
        category: string
      ) => Promise<{ success: boolean; message: string }>
      searchGames: (keyword: string) => Promise<Game[]>
      countGames: () => Promise<{ count: number }>
      countGameTime: () => Promise<{ timeCount: number }>
      countLaunchTimes: () => Promise<{ launchCount: number }>
      countDayWeekMonth: () => Promise<{
        todayHours: number
        weekHours: number
        monthHours: number
      }>
      copyImages: (move: {
        origin: string
        target: string
        gameName: string
        oldFilePath: string
      }) => Promise<{ relativePath: string }>
      delectImages: (relative_path: string) => Promise<string>
      openFolder: (folderPath: string) => Promise<void>
      sendNotification: (title: string, body: string) => Promise<void>
      setGameMode: (mode: string) => Promise<void>
      onOpenRestTimeModal: (callback: () => void) => Promise<void>
      offOpenRestTimeModal: () => Promise<void>
      setResting: (resting: boolean) => Promise<void>
      getGameLogByMode: () => Promise<{
        normalHours: number
        fastHours: number
        afkHours: number
        infinityHours: number
      }>
      getGameLogByModeThisWeek: () => Promise<GameLog[]>
      getGameLogByModeLastWeek: () => Promise<GameLog[]>
      backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>
      updateGameVersion: (
        gameId: number,
        type: 'minor' | 'major',
        summary: string,
        fileSize?: number
      ) => Promise<{
        id?: number
        version?: string
        summary?: string
        created_at?: number
      }>
      getVersionSummary: (versionId: number) => Promise<{
        id: number
        game_id: number
        version: string
        summary: string
        created_at: number
      } | null>
      getVersionsByGame: (gameId: number) => Promise<
        Array<{
          id: number
          game_id: number
          version: string
          summary: string
          file_size?: number
          created_at: number
        }>
      >
      updateVersionDescription: (
        versionId: number,
        newDescription: string
      ) => Promise<{ success: boolean; message: string }>
      createAchievement: (
        gameId: number,
        achievementName: string,
        achievementType: string,
        description?: string
      ) => Promise<{
        id: number
        gameId: number
        achievementName: string
        achievementType: string
        description?: string
        isCompleted: 0
      }>
      deleteAchievement: (achievementId: number) => Promise<void>
      toggleAchievementStatus: (achievementId: number, isCompleted: 0 | 1) => Promise<void>
      getGameAchievements: (gameId: number) => Promise<GameAchievement[]>
      getCompletedAchievements: (gameId: number) => Promise<GameAchievement[]>
      getUncompletedAchievements: (gameId: number) => Promise<GameAchievement[]>
      getAchievementStats: (gameId: number) => Promise<{
        total: number
        completed: number
        completionRate: number
      }>
      addGameLink: (
        gameId: number,
        metadata: {
          url: string
          title: string
          description: string
          favicon: string
        }
      ) => Promise<{ id?: number | bigint } | null>
      getGameLinks: (gameId: number) => Promise<
        Array<{
          id: number
          game_id: number
          url: string
          title: string
          description: string
          icon: string
          created_at: number
          updated_at: number
        }>
      >
      deleteGameLink: (linkId: number) => Promise<{ changes?: number } | unknown>
      updateGameLink: (
        linkId: number,
        title: string
        url: string
      ) => Promise<{ changes?: number } | unknown>
      setGameSavePath: (
        gameId: number,
        savePath: string,
        fileSize?: number
      ) => Promise<{
        id: number
        gameId: number
        savePath: string
        fileSize: number
      }>
      getGameSavePath: (gameId: number) => Promise<{
        id: number
        game_id: number
        save_path: string
        file_size: number
        created_at: number
        updated_at: number
      } | null>
      updateGameSavePath: (
        gameId: number,
        savePath: string
      ) => Promise<{ success: boolean; message: string }>
      updateSavePathSize: (
        gameId: number,
        fileSize: number
      ) => Promise<{ success: boolean; message: string }>
      deleteGameSavePath: (gameId: number) => Promise<{ success: boolean; message: string }>
      createSaveBackup: (gameId: number) => Promise<{
        success: boolean
        message: string
        backupId?: number
        backupName?: string
        fileSize?: number
      }>
      getSaveBackups: (gameId: number) => Promise<
        Array<{
          id: number
          game_id: number
          backup_name: string
          backup_path: string
          file_size: number
          created_at: number
        }>
      >
      restoreSaveBackup: (
        backupId: number,
        gameId: number
      ) => Promise<{ success: boolean; message: string }>
      deleteSaveBackup: (backupId: number) => Promise<{ success: boolean; message: string }>
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      isWindowMaximized: () => Promise<boolean>
      enableScreenshotShortcut: () => Promise<{ success: boolean; message: string }>
      disableScreenshotShortcut: () => Promise<{ success: boolean; message: string }>
      getScreenshotShortcutStatus: () => Promise<{ enabled: boolean }>
      onScreenshotSuccess: (callback: (data: { path: string; filename: string }) => void) => void
      onScreenshotError: (callback: (data: { error: string }) => void) => void
      offScreenshotSuccess: () => void
      offScreenshotError: () => void
      openDevTools: () => Promise<void>
      getTempDrop: (payload: DropPayload) => Promise<DropResult>
    }
  }
}

export {}
