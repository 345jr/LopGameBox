import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { VscAdd, VscCheck, VscTrash } from 'react-icons/vsc'
import { useAppBackgrounds, useDefaultBanners } from '@renderer/api/queries/queries.settings'
import { queryKeys } from '@renderer/api/queryKeys'
import builtinBackground from '@renderer/assets/background.jpg'

type ThemeImageItem = { id: string; relativePath: string; createdAt: number }

type ThemeImagePickerProps = {
  subtitle: string
  items: ThemeImageItem[]
  selectedId: string | null
  maxCount: number
  loading: boolean
  busyId: string | null
  adding: boolean
  emptyHint: string
  addLabel: string
  onAdd: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  /** 可选：内置默认项（如应用背景） */
  builtin?: {
    src: string
    label: string
    selected: boolean
    onSelect: () => void
  }
}

/** 紧凑缩略图：预览为主，尺寸统一 */
const thumbClass =
  'relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border bg-stone-100 transition-colors'

const ThemeImagePicker = ({
  subtitle,
  items,
  selectedId,
  maxCount,
  loading,
  busyId,
  adding,
  emptyHint,
  addLabel,
  onAdd,
  onSelect,
  onDelete,
  builtin
}: ThemeImagePickerProps) => {
  const canAdd = items.length < maxCount

  return (
    <div className="mt-4 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs leading-relaxed text-gray-500">{subtitle}</p>
        <span className="shrink-0 text-xs tabular-nums text-gray-400">
          {items.length}/{maxCount}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">加载中…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {builtin && (
            <button
              type="button"
              onClick={builtin.onSelect}
              disabled={!!busyId}
              title={builtin.selected ? '当前使用' : builtin.label}
              className={`${thumbClass} cursor-pointer disabled:cursor-wait ${
                builtin.selected
                  ? 'border-blue-500 ring-1 ring-blue-400/80'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={builtin.src}
                alt={builtin.label}
                className="h-full w-full object-cover object-center"
              />
              {builtin.selected && (
                <span className="absolute top-1 left-1 inline-flex size-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                  <VscCheck className="size-2.5" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/45 px-1 py-0.5 text-center text-[10px] leading-none text-white">
                {builtin.label}
              </span>
            </button>
          )}

          {items.map((item) => {
            const selected = item.id === selectedId
            const src = `lop://${item.relativePath.replace(/\\/g, '/')}`
            return (
              <div key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  disabled={!!busyId}
                  title={selected ? '当前使用' : '点击选用'}
                  className={`${thumbClass} cursor-pointer disabled:cursor-wait ${
                    selected
                      ? 'border-blue-500 ring-1 ring-blue-400/80'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={src}
                    alt="预览"
                    className="h-full w-full object-cover object-center"
                  />
                  {selected && (
                    <span className="absolute top-1 left-1 inline-flex size-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                      <VscCheck className="size-2.5" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={!!busyId}
                  className="absolute -top-1.5 -right-1.5 z-10 inline-flex size-5 items-center justify-center rounded-full bg-stone-700 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:cursor-wait"
                  title="删除"
                  aria-label="删除"
                >
                  <VscTrash className="size-3" />
                </button>
              </div>
            )
          })}

          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              title={addLabel}
              className={`${thumbClass} flex cursor-pointer flex-col items-center justify-center gap-0.5 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-500 disabled:cursor-wait disabled:opacity-60`}
            >
              <VscAdd className="size-4" />
              <span className="text-[10px] leading-none">{adding ? '…' : '上传'}</span>
            </button>
          )}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-1.5 text-[11px] text-gray-400">{emptyHint}</p>
      )}
    </div>
  )
}

/**
 * 本地设置页：仅保留不依赖远端服务的功能。
 */
const SettingPage = () => {
  const [screenshotEnabled, setScreenshotEnabled] = useState(false)
  const [bannerBusyId, setBannerBusyId] = useState<string | null>(null)
  const [bannerAdding, setBannerAdding] = useState(false)
  const [bgBusyId, setBgBusyId] = useState<string | null>(null)
  const [bgAdding, setBgAdding] = useState(false)
  const queryClient = useQueryClient()
  const { data: bannerState, isLoading: bannersLoading } = useDefaultBanners()
  const { data: bgState, isLoading: bgLoading } = useAppBackgrounds()

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

  // ----- 默认封面 -----
  const handleAddDefaultBanner = async () => {
    if (bannerAdding) return
    setBannerAdding(true)
    try {
      const result = await window.api.addDefaultBanner()
      if (result.canceled) return
      queryClient.setQueryData(queryKeys.defaultBanners(), result.state)
      toast.success('默认封面已添加')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '添加失败')
    } finally {
      setBannerAdding(false)
    }
  }

  const handleSelectDefaultBanner = async (id: string) => {
    if (id === bannerState?.selectedId || bannerBusyId) return
    setBannerBusyId(id)
    try {
      const state = await window.api.selectDefaultBanner(id)
      queryClient.setQueryData(queryKeys.defaultBanners(), state)
      toast.success('已设为当前默认封面')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '切换失败')
      await queryClient.invalidateQueries({ queryKey: queryKeys.defaultBanners() })
    } finally {
      setBannerBusyId(null)
    }
  }

  const handleDeleteDefaultBanner = async (id: string) => {
    if (bannerBusyId) return
    setBannerBusyId(id)
    try {
      const state = await window.api.deleteDefaultBanner(id)
      queryClient.setQueryData(queryKeys.defaultBanners(), state)
      toast.success('已删除')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '删除失败')
      await queryClient.invalidateQueries({ queryKey: queryKeys.defaultBanners() })
    } finally {
      setBannerBusyId(null)
    }
  }

  // ----- 应用背景 -----
  const handleAddAppBackground = async () => {
    if (bgAdding) return
    setBgAdding(true)
    try {
      const result = await window.api.addAppBackground()
      if (result.canceled) return
      queryClient.setQueryData(queryKeys.appBackgrounds(), result.state)
      toast.success('背景图已添加')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '添加失败')
    } finally {
      setBgAdding(false)
    }
  }

  const handleSelectAppBackground = async (id: string | null) => {
    if (id === (bgState?.selectedId ?? null) || bgBusyId) return
    setBgBusyId(id ?? '__builtin__')
    try {
      const state = await window.api.selectAppBackground(id)
      queryClient.setQueryData(queryKeys.appBackgrounds(), state)
      toast.success(id ? '已设为当前背景' : '已恢复内置背景')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '切换失败')
      await queryClient.invalidateQueries({ queryKey: queryKeys.appBackgrounds() })
    } finally {
      setBgBusyId(null)
    }
  }

  const handleDeleteAppBackground = async (id: string) => {
    if (bgBusyId) return
    setBgBusyId(id)
    try {
      const state = await window.api.deleteAppBackground(id)
      queryClient.setQueryData(queryKeys.appBackgrounds(), state)
      toast.success('已删除')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '删除失败')
      await queryClient.invalidateQueries({ queryKey: queryKeys.appBackgrounds() })
    } finally {
      setBgBusyId(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <section className="w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">基础配置</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={handleScreenshotToggle}
            className={`cursor-pointer rounded px-4 py-2 transition-colors ${
              screenshotEnabled
                ? 'bg-red-400 text-white hover:bg-red-600'
                : 'bg-gray-300 text-black hover:bg-gray-500 hover:text-white'
            }`}
          >
            {screenshotEnabled ? '禁用截图快捷键 (F12)' : '启用截图快捷键 (F12)'}
          </button>

          <button
            onClick={handleLocalBackup}
            className="cursor-pointer rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
          >
            本地备份数据库
          </button>

          <Link
            to="/setting/update"
            className="inline-block cursor-pointer rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
          >
            查看更新记录
          </Link>
        </div>
      </section>

      <section className="w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">主题样式</h2>

        <ThemeImagePicker
          subtitle={`默认游戏封面（最多 ${bannerState?.maxCount ?? 3} 张）`}
          items={bannerState?.items ?? []}
          selectedId={bannerState?.selectedId ?? null}
          maxCount={bannerState?.maxCount ?? 3}
          loading={bannersLoading}
          busyId={bannerBusyId}
          adding={bannerAdding}
          emptyHint="尚未上传。上传并选用后，新游戏会使用该封面。"
          addLabel="上传封面"
          onAdd={handleAddDefaultBanner}
          onSelect={handleSelectDefaultBanner}
          onDelete={handleDeleteDefaultBanner}
        />

        <div className="my-4 border-t border-gray-100" />

        <ThemeImagePicker
          subtitle={`应用背景：游戏列表背景（最多 ${bgState?.maxCount ?? 6} 张）`}
          items={bgState?.items ?? []}
          selectedId={bgState?.selectedId ?? null}
          maxCount={bgState?.maxCount ?? 6}
          loading={bgLoading}
          busyId={bgBusyId}
          adding={bgAdding}
          emptyHint="可上传自定义背景；点「内置默认」可随时切回。"
          addLabel="上传背景"
          onAdd={handleAddAppBackground}
          onSelect={(id) => handleSelectAppBackground(id)}
          onDelete={handleDeleteAppBackground}
          builtin={{
            src: builtinBackground,
            label: '内置默认',
            selected: !bgState?.selectedId,
            onSelect: () => handleSelectAppBackground(null)
          }}
        />
      </section>
    </div>
  )
}

export default SettingPage
