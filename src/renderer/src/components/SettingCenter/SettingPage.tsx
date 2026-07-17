import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { VscAdd, VscCheck, VscTrash } from 'react-icons/vsc'
import { useDefaultBanners } from '@renderer/api/queries/queries.settings'
import { queryKeys } from '@renderer/api/queryKeys'

/**
 * 本地设置页：仅保留不依赖远端服务的功能。
 */
const SettingPage = () => {
  const [screenshotEnabled, setScreenshotEnabled] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const queryClient = useQueryClient()
  const { data: bannerState, isLoading: bannersLoading } = useDefaultBanners()

  const maxCount = bannerState?.maxCount ?? 3
  const items = bannerState?.items ?? []
  const selectedId = bannerState?.selectedId ?? null
  const canAdd = items.length < maxCount

  const invalidateDefaultBanners = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.defaultBanners() })

  useEffect(() => {
    const initScreenshotStatus = async () => {
      try {
        const status = await window.api.getScreenshotShortcutStatus()
        setScreenshotEnabled(status.enabled)
      } catch (error) {
        console.error('[Screenshot] get shortcut status failed:', error)
      }
    }
    initScreenshotStatus()

    window.api.onScreenshotSuccess((data) => {
      toast.success(`截图已保存: ${data.filename}`)
    })

    window.api.onScreenshotError((data) => {
      toast.error(`截图失败: ${data.error}`)
    })

    return () => {
      window.api.offScreenshotSuccess()
      window.api.offScreenshotError()
    }
  }, [])

  const handleScreenshotToggle = async () => {
    if (screenshotEnabled) {
      toast.promise(
        window.api.disableScreenshotShortcut().then(() => {
          setScreenshotEnabled(false)
        }),
        {
          loading: '正在禁用截图快捷键...',
          success: '截图快捷键已禁用',
          error: (err) => `禁用失败: ${err.message || String(err)}`
        }
      )
    } else {
      toast.promise(
        window.api.enableScreenshotShortcut().then(() => {
          setScreenshotEnabled(true)
        }),
        {
          loading: '正在启用截图快捷键...',
          success: '截图快捷键已启用（按 F12 截图）',
          error: (err) => `启用失败: ${err.message || String(err)}`
        }
      )
    }
  }

  const handleLocalBackup = async () => {
    toast.promise(
      window.api.backupDatabase().then((result) => {
        if (!result.success) {
          throw new Error(result.error || '备份失败')
        }
        return result.path || ''
      }),
      {
        loading: '正在备份数据库...',
        success: (path) => (path ? `备份成功：${path}` : '备份成功'),
        error: (err) => `备份失败: ${err.message || String(err)}`
      }
    )
  }

  const handleAddDefaultBanner = async () => {
    if (!canAdd || adding) return
    setAdding(true)
    try {
      const result = await window.api.addDefaultBanner()
      if (result.canceled) return
      queryClient.setQueryData(queryKeys.defaultBanners(), result.state)
      toast.success('默认封面已添加')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message || '添加失败')
    } finally {
      setAdding(false)
    }
  }

  const handleSelectDefaultBanner = async (id: string) => {
    if (id === selectedId || busyId) return
    setBusyId(id)
    try {
      const state = await window.api.selectDefaultBanner(id)
      queryClient.setQueryData(queryKeys.defaultBanners(), state)
      toast.success('已设为当前默认封面')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message || '切换失败')
      await invalidateDefaultBanners()
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteDefaultBanner = async (id: string) => {
    if (busyId) return
    setBusyId(id)
    try {
      const state = await window.api.deleteDefaultBanner(id)
      queryClient.setQueryData(queryKeys.defaultBanners(), state)
      toast.success('已删除')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message || '删除失败')
      await invalidateDefaultBanners()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <section className="w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">基础配置</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={handleScreenshotToggle}
            className={`rounded px-4 py-2 transition-colors ${
              screenshotEnabled
                ? 'bg-red-400 text-white hover:bg-red-600'
                : 'bg-gray-300 text-black hover:bg-gray-500 hover:text-white'
            }`}
          >
            {screenshotEnabled ? '禁用截图快捷键 (F12)' : '启用截图快捷键 (F12)'}
          </button>

          <button
            onClick={handleLocalBackup}
            className="rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
          >
            本地备份数据库
          </button>

          <Link
            to="/setting/update"
            className="inline-block rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
          >
            查看更新记录
          </Link>
        </div>
      </section>

      <section className="w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">主题样式</h2>
            <p className="mt-1 text-sm text-gray-500">
              默认游戏封面：新游戏与未自定义封面的游戏会使用此处选中的图片（最多 {maxCount} 张）
            </p>
          </div>
          <span className="shrink-0 text-sm text-gray-400">
            {items.length}/{maxCount}
          </span>
        </div>

        {bannersLoading ? (
          <p className="mt-4 text-sm text-gray-400">加载中…</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const selected = item.id === selectedId
              const src = `lop://${item.relativePath.replace(/\\/g, '/')}`
              return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-xl border-2 bg-stone-50 transition-shadow ${
                    selected
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectDefaultBanner(item.id)}
                    disabled={!!busyId}
                    className="block w-full cursor-pointer text-left disabled:cursor-wait"
                    title={selected ? '当前默认封面' : '设为默认封面'}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-stone-200">
                      <img
                        src={src}
                        alt="默认封面"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="text-sm text-gray-700">
                        {selected ? '使用中' : '点击选用'}
                      </span>
                      {selected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          <VscCheck className="size-3.5" />
                          默认
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDefaultBanner(item.id)}
                    disabled={!!busyId}
                    className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:cursor-wait"
                    title="删除"
                    aria-label="删除默认封面"
                  >
                    <VscTrash className="size-4" />
                  </button>
                </div>
              )
            })}

            {canAdd && (
              <button
                type="button"
                onClick={handleAddDefaultBanner}
                disabled={adding}
                className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-stone-50 px-4 py-6 text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
              >
                <VscAdd className="size-7" />
                <span className="text-sm font-medium">{adding ? '添加中…' : '上传封面'}</span>
              </button>
            )}
          </div>
        )}

        {!bannersLoading && items.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">
            尚未上传默认封面。上传并选用后，新添加的游戏会使用该图。
          </p>
        )}
      </section>
    </div>
  )
}

export default SettingPage
