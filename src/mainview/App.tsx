import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BannerDTO, GameRowDTO } from '@shared/rpc'
import { initRpc, rpcRequest } from './rpcClient'

type RuntimeInfo = Awaited<ReturnType<typeof rpcRequest<'getRuntimeInfo'>>>

function formatPlayTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

export function App(): React.JSX.Element {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<RuntimeInfo | null>(null)
  const [games, setGames] = useState<GameRowDTO[]>([])
  const [banners, setBanners] = useState<BannerDTO[]>([])
  const [keyword, setKeyword] = useState('')
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [maximized, setMaximized] = useState(false)
  const [pickedPath, setPickedPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const bannerByGame = useMemo(() => {
    const map = new Map<number, BannerDTO>()
    for (const b of banners) {
      if (!map.has(b.game_id)) map.set(b.game_id, b)
    }
    return map
  }, [banners])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await initRpc()
      const t0 = performance.now()
      await rpcRequest('ping', { note: 'ui-refresh' })
      setPingMs(Math.round(performance.now() - t0))

      const [runtime, list, bannerList] = await Promise.all([
        rpcRequest('getRuntimeInfo'),
        keyword.trim()
          ? rpcRequest('searchGames', { keyword: keyword.trim() })
          : rpcRequest('getAllGames'),
        rpcRequest('getBanners')
      ])
      setInfo(runtime)
      setGames(list)
      setBanners(bannerList)
      setMaximized(await rpcRequest('isWindowMaximized'))
      setReady(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="flex h-full flex-col">
      {/* Custom title bar */}
      <header className="titlebar-drag flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-900/90 px-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide text-amber-300">
            LopBox · Electrobun
          </span>
          <span className="titlebar-no-drag rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
            experiment
          </span>
          {pingMs !== null && (
            <span className="titlebar-no-drag text-[11px] text-zinc-500">RPC {pingMs}ms</span>
          )}
        </div>
        <div className="titlebar-no-drag flex items-center gap-1">
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
            onClick={() => void rpcRequest('minimizeWindow')}
          >
            ─
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
            onClick={async () => {
              await rpcRequest('maximizeWindow')
              setMaximized(await rpcRequest('isWindowMaximized'))
            }}
          >
            {maximized ? '❐' : '□'}
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-red-500/80 hover:text-white"
            onClick={() => void rpcRequest('closeWindow')}
          >
            ✕
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
        <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">底座迁移实验</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Electron → Electrobun（Bun 主进程 + 系统 WebView + 类型化 RPC + bun:sqlite）
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400"
                onClick={() => void refresh()}
              >
                刷新
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                onClick={() => void rpcRequest('openDevTools')}
              >
                DevTools
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                onClick={async () => {
                  const path = await rpcRequest('openFile')
                  setPickedPath(path)
                }}
              >
                打开文件对话框
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {info && (
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="状态" value={ready ? 'RPC 已连接' : '连接中…'} />
              <InfoItem label="平台" value={`${info.platform}/${info.arch}`} />
              <InfoItem label="Bun" value={info.bunVersion} />
              <InfoItem label="游戏数" value={String(info.gameCount)} />
              <InfoItem label="DB" value={info.dbPath} mono />
              <InfoItem label="资源服务" value={info.assetBaseUrl} mono />
            </dl>
          )}

          {pickedPath && (
            <p className="mt-3 truncate text-xs text-zinc-400">
              对话框选择：<span className="text-zinc-200">{pickedPath}</span>
            </p>
          )}
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-zinc-900/60">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-medium text-zinc-200">
              游戏列表（只读 RPC 验证） · {games.length}
            </h2>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索游戏名…"
              className="w-56 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm outline-none ring-amber-400/40 focus:ring"
            />
          </div>

          {loading ? (
            <div className="p-6 text-sm text-zinc-500">加载中…</div>
          ) : games.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              没有游戏数据。确认项目根目录 <code className="text-zinc-300">db/gameData.db</code>{' '}
              存在，或在 Electron 版里先添加游戏。
            </div>
          ) : (
            <ul className="divide-y divide-white/5 overflow-auto">
              {games.map((game) => {
                const banner = bannerByGame.get(game.id)
                return (
                  <li
                    key={game.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]"
                  >
                    <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-zinc-800">
                      {banner?.url ? (
                        <img
                          src={banner.url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                          no banner
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{game.game_name}</div>
                      <div className="truncate text-xs text-zinc-500">{game.launch_path}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                        <span>时长 {formatPlayTime(game.total_play_time)}</span>
                        <span>启动 {game.launch_count}</span>
                        <span>分类 {game.category || 'all'}</span>
                        <span>v{game.game_version}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                      onClick={() =>
                        void rpcRequest('openFolder', { folderPath: game.launch_path })
                      }
                    >
                      在资源管理器中显示
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <footer className="text-center text-[11px] text-zinc-600">
          分支 experiment/electrobun · 验证项：窗口 / RPC / SQLite / 对话框 / 资源服务 · 完整 UI
          与写操作尚未迁移
        </footer>
      </main>
    </div>
  )
}

function InfoItem({
  label,
  value,
  mono
}: {
  label: string
  value: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 break-all text-zinc-200 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
