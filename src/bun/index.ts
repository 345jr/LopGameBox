import { BrowserWindow, BrowserView, Utils } from 'electrobun/bun'
import type { LopBoxRPC } from '../shared/rpc'
import { startAssetServer } from './assetServer'
import { startHttpApi } from './httpApi'
import { dispatchApi, type ApiContext } from './apiHandlers'
import { GameRuntime } from './gameRuntime'
import { GameService } from './services/gameService'
import { GameRepository } from './services/gameRepository'
import { GalleryRepository } from './services/galleryRepository'
import { GameLogsRepository } from './services/gameLogsRepository'
import { BackupService } from './services/backup'
import { DatabaseManager } from './db/databaseManager'

const VITE_DEV_PORT = 5173
const WINDOW_MIN = { width: 900, height: 600 }

const assets = startAssetServer()
DatabaseManager.getInstance()

const gameService = new GameService(
  new GameRepository(),
  new GalleryRepository(),
  new GameLogsRepository(),
  new BackupService()
)

let mainWindow: BrowserWindow | null = null
let screenshotEnabled = false
let httpApi: ReturnType<typeof startHttpApi> | null = null

function getWindow(): BrowserWindow {
  if (!mainWindow) throw new Error('Main window not ready')
  return mainWindow
}

function sendToWebview<K extends keyof LopBoxRPC['webview']['messages']>(
  name: K,
  payload: LopBoxRPC['webview']['messages'][K]
): void {
  // Prefer SSE (reliable). Also try Electrobun RPC if available.
  httpApi?.broadcast(name as string, payload)
  try {
    const rpc = mainWindow?.webview?.rpc
    if (!rpc) return
    ;(rpc.send as Record<string, (p: unknown) => void>)[name as string]?.(payload)
  } catch {
    /* optional */
  }
}

const runtime = new GameRuntime(gameService, {
  onTimerUpdate: (elapsedTime) => sendToWebview('timerUpdate', { elapsedTime }),
  onTimerStopped: (result) => sendToWebview('timerStopped', result),
  onOpenRestTimeModal: () => sendToWebview('openRestTimeModal', {})
})

const apiCtx: ApiContext = {
  getWindow,
  gameService,
  runtime,
  assetBaseUrl: assets.baseUrl,
  getScreenshotEnabled: () => screenshotEnabled,
  setScreenshotEnabled: (v) => {
    screenshotEnabled = v
  },
  onScreenshotRequest: () => {
    // Ask webview via SSE to capture; frontend posts PNG back via HTTP
    sendToWebview('requestScreenshot', {})
    void (async () => {
      try {
        const win = getWindow()
        const req = win.webview.rpc?.request as
          | { captureScreenshot?: () => Promise<{ ok: boolean; dataUrl?: string; error?: string }> }
          | undefined
        if (!req?.captureScreenshot) return
        const result = await req.captureScreenshot()
        if (result.ok && result.dataUrl) {
          const saved = (await dispatchApi(apiCtx, 'saveScreenshotPng', [result.dataUrl])) as {
            success: boolean
            path?: string
            filename?: string
            error?: string
          }
          if (saved.success && saved.path && saved.filename) {
            sendToWebview('screenshotSuccess', {
              path: saved.path,
              filename: saved.filename
            })
          } else {
            sendToWebview('screenshotError', { error: saved.error || 'save failed' })
          }
        }
      } catch (err) {
        console.error('[Screenshot] capture error:', err)
      }
    })()
  }
}

// HTTP API first (primary path for window.api)
httpApi = startHttpApi(apiCtx)
// Keep handlers in sync if asset base is needed with port in response
apiCtx.assetBaseUrl = assets.baseUrl

// Keep Electrobun RPC as secondary path (messages / optional)
const rpc = BrowserView.defineRPC<LopBoxRPC>({
  maxRequestTime: 60000,
  handlers: {
    requests: {
      call: async ({ method, args }) => {
        console.log(`[RPC] → ${method}`)
        return dispatchApi(apiCtx, method, args ?? [])
      }
    },
    messages: {
      logFromWebview: ({ msg }) => console.log('[webview]', msg)
    }
  }
})

async function resolveWindowUrl(): Promise<string> {
  try {
    const res = await fetch(`http://127.0.0.1:${VITE_DEV_PORT}`, { method: 'HEAD' })
    if (res.ok || res.status < 500) {
      console.log('[Window] Vite HMR http://127.0.0.1:' + VITE_DEV_PORT)
      return `http://127.0.0.1:${VITE_DEV_PORT}`
    }
  } catch {
    // fall through
  }
  console.log('[Window] views://mainview/index.html')
  return 'views://mainview/index.html'
}

async function main(): Promise<void> {
  const url = await resolveWindowUrl()

  // Inject API base into the page via query (renderer also probes default port)
  const apiBase = httpApi!.baseUrl
  const withQuery =
    url.includes('?') ? `${url}&apiBase=${encodeURIComponent(apiBase)}` : `${url}?apiBase=${encodeURIComponent(apiBase)}`

  // views:// may ignore query — also store on global via evaluate after load
  mainWindow = new BrowserWindow({
    title: 'LopBox',
    url: url.startsWith('views://') ? url : withQuery,
    titleBarStyle: 'hidden',
    frame: {
      width: WINDOW_MIN.width,
      height: WINDOW_MIN.height,
      x: 100,
      y: 60
    },
    rpc
  })

  // Tell the webview the HTTP API base as soon as possible
  setTimeout(() => {
    try {
      mainWindow?.webview.executeJavascript(
        `window.__LOP_API_BASE__=${JSON.stringify(apiBase)};window.__LOP_ASSET_BASE__=${JSON.stringify(assets.baseUrl)};console.log('[inject] api', window.__LOP_API_BASE__);`
      )
    } catch (err) {
      console.warn('[inject] failed', err)
    }
  }, 500)

  mainWindow.on('close', () => {
    assets.stop()
    httpApi?.stop()
    DatabaseManager.close()
    mainWindow = null
  })

  try {
    mainWindow.webview.openDevTools()
  } catch (err) {
    console.warn('[DevTools] auto-open failed:', err)
  }

  console.log('[LopBox] Electrobun app started')
  console.log('[LopBox] db:', DatabaseManager.getPath())
  console.log('[LopBox] games:', gameService.countGames().count)
  console.log('[LopBox] http api:', apiBase)
  console.log('[LopBox] assets:', assets.baseUrl)
}

main().catch((err) => {
  console.error('[LopBox] failed to start:', err)
  Utils.quit()
})
