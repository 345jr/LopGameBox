/**
 * window.api bridge for Electrobun.
 *
 * Primary transport: local HTTP + SSE (reliable on Windows WebView2).
 * Electrobun typed RPC is optional/fallback only.
 */

type Listener = (...args: any[]) => void

const listeners: Record<string, Set<Listener>> = {
  timerUpdate: new Set(),
  timerStopped: new Set(),
  openRestTimeModal: new Set(),
  screenshotSuccess: new Set(),
  screenshotError: new Set()
}

const DEFAULT_API = 'http://127.0.0.1:39212'
const DEFAULT_ASSETS = 'http://127.0.0.1:39211/assets'

let apiBase = DEFAULT_API
let assetBaseUrl = DEFAULT_ASSETS
let ready: Promise<void> | null = null
let sse: EventSource | null = null

function resolveApiBase(): string {
  const w = window as Window & { __LOP_API_BASE__?: string }
  if (w.__LOP_API_BASE__) return w.__LOP_API_BASE__
  try {
    const q = new URLSearchParams(window.location.search)
    const fromQuery = q.get('apiBase')
    if (fromQuery) return fromQuery
  } catch {
    /* ignore */
  }
  return DEFAULT_API
}

function resolveAssetBase(): string {
  const w = window as Window & { __LOP_ASSET_BASE__?: string }
  return w.__LOP_ASSET_BASE__ || DEFAULT_ASSETS
}

async function httpCall(method: string, args: unknown[] = []): Promise<unknown> {
  const url = `${apiBase}/api/call`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, args })
  })
  const body = (await res.json()) as {
    ok?: boolean
    result?: unknown
    error?: string
  }
  if (!res.ok || body.ok === false) {
    throw new Error(body.error || `HTTP ${res.status} for ${method}`)
  }
  return body.result
}

function wireSse(): void {
  if (sse) {
    try {
      sse.close()
    } catch {
      /* ignore */
    }
  }
  sse = new EventSource(`${apiBase}/events`)
  const bind = (name: string) => {
    sse!.addEventListener(name, (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data)
        listeners[name]?.forEach((cb) => {
          if (name === 'timerUpdate') cb(data.elapsedTime)
          else if (name === 'openRestTimeModal' || name === 'requestScreenshot') cb()
          else cb(data)
        })
      } catch (err) {
        console.warn('[sse] parse', name, err)
      }
    })
  }
  ;[
    'timerUpdate',
    'timerStopped',
    'openRestTimeModal',
    'screenshotSuccess',
    'screenshotError',
    'requestScreenshot'
  ].forEach(bind)

  sse.addEventListener('requestScreenshot', () => {
    void (async () => {
      try {
        const { toPng } = await import('html-to-image')
        const dataUrl = await toPng(document.body, {
          cacheBust: true,
          pixelRatio: window.devicePixelRatio || 1
        })
        const saved = (await httpCall('saveScreenshotPng', [dataUrl])) as {
          success: boolean
          path?: string
          filename?: string
          error?: string
        }
        if (saved.success && saved.path && saved.filename) {
          listeners.screenshotSuccess.forEach((cb) =>
            cb({ path: saved.path!, filename: saved.filename! })
          )
        } else {
          listeners.screenshotError.forEach((cb) =>
            cb({ error: saved.error || 'save failed' })
          )
        }
      } catch (err) {
        listeners.screenshotError.forEach((cb) =>
          cb({ error: err instanceof Error ? err.message : String(err) })
        )
      }
    })()
  })

  sse.onerror = () => {
    console.warn('[sse] connection error, will keep retrying (browser EventSource)')
  }
  sse.onopen = () => console.log('[sse] connected', apiBase)
}

async function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // Wait a bit for main-process inject of __LOP_API_BASE__
      for (let i = 0; i < 30; i++) {
        apiBase = resolveApiBase()
        assetBaseUrl = resolveAssetBase()
        try {
          const res = await fetch(`${apiBase}/health`, { method: 'GET' })
          if (res.ok) break
        } catch {
          /* retry */
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      apiBase = resolveApiBase()
      assetBaseUrl = resolveAssetBase()
      window.__LOP_ASSET_BASE__ = assetBaseUrl
      ;(window as Window & { __LOP_API_BASE__?: string }).__LOP_API_BASE__ = apiBase

      // Probe API
      const pong = (await httpCall('ping', [{ note: 'http-bridge' }])) as { ok?: boolean }
      if (!pong?.ok && pong !== undefined) {
        console.warn('[bridge] unexpected ping response', pong)
      }
      wireSse()
      console.log('[bridge] HTTP API ready', { apiBase, assetBaseUrl })
    })()
  }
  await ready
}

async function call(method: string, ...args: unknown[]): Promise<unknown> {
  await ensureReady()
  return httpCall(method, args)
}

function on(channel: string, cb: Listener): void {
  listeners[channel]?.add(cb)
}

function off(channel: string, cb?: Listener): void {
  if (!listeners[channel]) return
  if (cb) listeners[channel].delete(cb)
  else listeners[channel].clear()
}

export function assetUrl(relativePath?: string | null): string {
  if (!relativePath) return ''
  const rel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!rel || rel === 'banner/default.jpg') return ''
  const base = assetBaseUrl || window.__LOP_ASSET_BASE__ || DEFAULT_ASSETS
  return `${base}/${rel}`
}

export function createWindowApi(): Window['api'] {
  const api = {
    openFile: () => call('openFile') as Promise<string>,
    selectFolder: () => call('selectFolder') as Promise<string | null>,
    executeFile: (game: { id: number; path: string; gameMode: string }) =>
      call('executeFile', game) as Promise<{ success: boolean; message?: string }>,

    onTimerUpdate: (callback: (elapsedTime: number) => void) => on('timerUpdate', callback),
    onTimerStopped: (
      callback: (result: { code: number; finalElapsedTime: number }) => void
    ) => on('timerStopped', callback),
    offTimerUpdate: (callback: (elapsedTime: number) => void) => off('timerUpdate', callback),
    offTimerStopped: (
      callback: (result: { code: number; finalElapsedTime: number }) => void
    ) => off('timerStopped', callback),

    getAllGames: () => call('getAllGames'),
    getGamesByCategory: (category: string) => call('getGamesByCategory', category),
    getGameById: (id: number) => call('getGameById', id),
    addGame: (game: { gameName: string; launchPath: string }) => call('addGame', game),
    deleteGame: (id: number) => call('deleteGame', id),
    getBanners: () => call('getBanners'),
    addBanner: (gameImage: {
      gameId: number
      imagePath: string
      relativePath: string
    }) => call('addBanner', gameImage),
    getGameSnapshot: (gameId: number, newestFirst?: boolean) =>
      call('getGameSnapshot', gameId, newestFirst ?? true),
    addGameSnapshot: (gameImage: {
      gameId: number
      imagePath: string
      relativePath: string
    }) => call('addGameSnapshot', gameImage),
    delectSnapshot: (id: number) => call('delectSnapshot', id),
    updateSnapshotAlt: (id: number, alt: string) => call('updateSnapshotAlt', id, alt),
    deleteSnapshotAlt: (id: number) => call('deleteSnapshotAlt', id),
    getSnapshotAlt: (id: number) => call('getSnapshotAlt', id),
    modifyGameName: (id: number, newName: string) => call('modifyGameName', id, newName),
    updateGameSize: (id: number, launch_path: string) => call('updateGameSize', id, launch_path),
    getFolderSize: (folderPath: string) => call('getFolderSize', folderPath),
    updateGamePath: (gameId: number, newPath: string) => call('updateGamePath', gameId, newPath),
    updateGameCategory: (gameId: number, category: string) =>
      call('updateGameCategory', gameId, category),
    searchGames: (keyword: string) => call('searchGames', keyword),
    countGames: () => call('countGames'),
    countGameTime: () => call('countGameTime'),
    countLaunchTimes: () => call('countLaunchTimes'),
    countDayWeekMonth: () => call('countDayWeekMonth'),
    copyImages: (move: {
      origin: string
      target: string
      gameName: string
      oldFilePath: string
    }) => call('copyImages', move),
    delectImages: (relative_path: string) => call('delectImages', relative_path),
    openFolder: (folderPath: string) => call('openFolder', folderPath) as Promise<void>,
    sendNotification: (title: string, body: string) =>
      call('sendNotification', title, body) as Promise<void>,
    setGameMode: (mode: string) => call('setGameMode', mode) as Promise<void>,
    onOpenRestTimeModal: (callback: () => void) => {
      on('openRestTimeModal', callback)
      return Promise.resolve()
    },
    offOpenRestTimeModal: () => {
      off('openRestTimeModal')
      return Promise.resolve()
    },
    setResting: (resting: boolean) => call('setResting', resting) as Promise<void>,
    getGameLogByMode: () => call('getGameLogByMode'),
    getGameLogByModeThisWeek: () => call('getGameLogByModeThisWeek'),
    getGameLogByModeLastWeek: () => call('getGameLogByModeLastWeek'),
    backupDatabase: () => call('backupDatabase'),
    updateGameVersion: (
      gameId: number,
      type: 'minor' | 'major',
      summary: string,
      fileSize?: number
    ) => call('updateGameVersion', gameId, type, summary, fileSize),
    getVersionSummary: (versionId: number) => call('getVersionSummary', versionId),
    getVersionsByGame: (gameId: number) => call('getVersionsByGame', gameId),
    updateVersionDescription: (versionId: number, newDescription: string) =>
      call('updateVersionDescription', versionId, newDescription),
    createAchievement: (
      gameId: number,
      achievementName: string,
      achievementType: string,
      description?: string
    ) => call('createAchievement', gameId, achievementName, achievementType, description),
    deleteAchievement: (achievementId: number) => call('deleteAchievement', achievementId),
    toggleAchievementStatus: (achievementId: number, isCompleted: 0 | 1) =>
      call('toggleAchievementStatus', achievementId, isCompleted),
    getGameAchievements: (gameId: number) => call('getGameAchievements', gameId),
    getCompletedAchievements: (gameId: number) => call('getCompletedAchievements', gameId),
    getUncompletedAchievements: (gameId: number) => call('getUncompletedAchievements', gameId),
    getAchievementStats: (gameId: number) => call('getAchievementStats', gameId),
    addGameLink: (
      gameId: number,
      metadata: { url: string; title: string; description: string; favicon: string }
    ) => call('addGameLink', gameId, metadata),
    getGameLinks: (gameId: number) => call('getGameLinks', gameId),
    deleteGameLink: (linkId: number) => call('deleteGameLink', linkId),
    updateGameLink: (linkId: number, title: string, url: string) =>
      call('updateGameLink', linkId, title, url),
    setGameSavePath: (gameId: number, savePath: string, fileSize?: number) =>
      call('setGameSavePath', gameId, savePath, fileSize ?? 0),
    getGameSavePath: (gameId: number) => call('getGameSavePath', gameId),
    updateGameSavePath: (gameId: number, savePath: string) =>
      call('updateGameSavePath', gameId, savePath),
    updateSavePathSize: (gameId: number, fileSize: number) =>
      call('updateSavePathSize', gameId, fileSize),
    deleteGameSavePath: (gameId: number) => call('deleteGameSavePath', gameId),
    createSaveBackup: (gameId: number) => call('createSaveBackup', gameId),
    getSaveBackups: (gameId: number) => call('getSaveBackups', gameId),
    restoreSaveBackup: (backupId: number, gameId: number) =>
      call('restoreSaveBackup', backupId, gameId),
    deleteSaveBackup: (backupId: number) => call('deleteSaveBackup', backupId),
    minimizeWindow: () => call('minimizeWindow') as Promise<void>,
    maximizeWindow: () => call('maximizeWindow') as Promise<void>,
    closeWindow: () => call('closeWindow') as Promise<void>,
    isWindowMaximized: () => call('isWindowMaximized') as Promise<boolean>,
    enableScreenshotShortcut: () =>
      call('enableScreenshotShortcut') as Promise<{ success: boolean; message: string }>,
    disableScreenshotShortcut: () =>
      call('disableScreenshotShortcut') as Promise<{ success: boolean; message: string }>,
    getScreenshotShortcutStatus: () =>
      call('getScreenshotShortcutStatus') as Promise<{ enabled: boolean }>,
    onScreenshotSuccess: (callback: (data: { path: string; filename: string }) => void) =>
      on('screenshotSuccess', callback),
    onScreenshotError: (callback: (data: { error: string }) => void) =>
      on('screenshotError', callback),
    offScreenshotSuccess: () => off('screenshotSuccess'),
    offScreenshotError: () => off('screenshotError'),
    openDevTools: () => call('openDevTools') as Promise<void>,
    getTempDrop: (payload: unknown) => call('getTempDrop', payload)
  }

  return api as unknown as Window['api']
}

export async function installElectrobunBridge(): Promise<void> {
  window.api = createWindowApi()
  await ensureReady()
}
