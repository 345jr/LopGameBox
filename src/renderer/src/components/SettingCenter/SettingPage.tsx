import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { VscAdd, VscCheck, VscTrash } from 'react-icons/vsc'
import {
  FiArchive,
  FiCamera,
  FiDatabase,
  FiFileText,
  FiFolder,
  FiImage,
  FiSettings
} from 'react-icons/fi'
import { useAppBackgrounds, useDefaultBanners } from '@renderer/api/queries/queries.settings'
import { queryKeys } from '@renderer/api/queryKeys'
import builtinBackground from '@renderer/assets/background.jpg'

type ThemeImageItem = { id: string; relativePath: string; createdAt: number }

type ThemeImagePickerProps = {
  title: string
  desc?: string
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

/** 统一卡片容器 */
const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-xs'

/** 统一次要按钮（描边风格） */
const actionBtnClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'

/** 分区头部：图标 + 标题 + 说明 */
const SectionHeader = ({
  icon: Icon,
  title,
  desc
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  desc: string
}) => (
  <div className="flex items-center gap-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
      <Icon className="size-4.5" />
    </span>
    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
    </div>
  </div>
)

/** 设置行：左侧文案，右侧控件 */
const SettingRow = ({
  title,
  desc,
  children
}: {
  title: string
  desc: string
  children: ReactNode
}) => (
  <div className="flex items-center justify-between gap-6 py-3.5">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{desc}</p>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)

/** 开关控件 */
const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label="截图快捷键"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5.5' : 'translate-x-0.5'
      }`}
    />
  </button>
)

/** 紧凑缩略图：预览为主，尺寸统一 */
const thumbClass =
  'relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border bg-gray-50 transition-colors'

const ThemeImagePicker = ({
  title,
  desc,
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
    <div className="mt-5 first:mt-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          {desc && <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{desc}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 tabular-nums">
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
                  ? 'border-blue-600 ring-2 ring-blue-600/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={builtin.src}
                alt={builtin.label}
                className="h-full w-full object-cover object-center"
              />
              {builtin.selected && (
                <span className="absolute top-1 left-1 inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
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
                      ? 'border-blue-600 ring-2 ring-blue-600/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={src} alt="预览" className="h-full w-full object-cover object-center" />
                  {selected && (
                    <span className="absolute top-1 left-1 inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
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
              className={`${thumbClass} flex cursor-pointer flex-col items-center justify-center gap-1 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-500 disabled:cursor-wait disabled:opacity-60`}
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
  const [paths, setPaths] = useState<{
    database: string
    screenshots: string
    saveBackups: string
  } | null>(null)
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

    const fetchPaths = async () => {
      try {
        const pathsData = await window.api.getPaths()
        setPaths(pathsData)
      } catch (error) {
        console.error('[Settings] get paths failed:', error)
      }
    }
    fetchPaths()

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

  // 存储位置条目（图标与路径的映射，统一单色风格）
  const storageItems = paths
    ? [
        { icon: FiDatabase, label: '数据库', value: paths.database },
        { icon: FiCamera, label: '截图', value: paths.screenshots },
        { icon: FiArchive, label: '存档备份', value: paths.saveBackups }
      ]
    : []

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-6">
      {/* 页头 */}
      <header className="px-1">
        <h1 className="text-lg font-semibold text-gray-900">设置中心</h1>
        <p className="mt-0.5 text-xs text-gray-400">快捷键、数据备份与界面外观</p>
      </header>

      {/* 基础配置 */}
      <section className={cardClass}>
        <SectionHeader icon={FiSettings} title="基础配置" desc="快捷键与数据维护" />
        <div className="mt-1 divide-y divide-gray-100">
          <SettingRow title="截图快捷键" desc="游戏运行中按 F12 截图，自动保存到截图目录">
            <Switch checked={screenshotEnabled} onChange={handleScreenshotToggle} />
          </SettingRow>
          <SettingRow title="本地备份数据库" desc="将当前数据库完整复制一份到存档备份目录">
            <button onClick={handleLocalBackup} className={actionBtnClass}>
              <FiDatabase className="size-3.5" />
              立即备份
            </button>
          </SettingRow>
          <SettingRow title="更新记录" desc="查看各版本的功能变更与优化说明">
            <Link to="/setting/update" className={actionBtnClass}>
              <FiFileText className="size-3.5" />
              查看
            </Link>
          </SettingRow>
        </div>
      </section>

      {/* 存储位置 */}
      {paths && (
        <section className={cardClass}>
          <SectionHeader icon={FiFolder} title="存储位置" desc="应用数据在本地的保存路径" />
          <ul className="mt-2 divide-y divide-gray-100">
            {storageItems.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="truncate font-mono text-[11px] text-gray-400" title={value}>
                    {value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 主题样式 */}
      <section className={cardClass}>
        <SectionHeader icon={FiImage} title="主题样式" desc="默认封面与游戏列表背景" />

        <ThemeImagePicker
          title="默认游戏封面"
          desc={`最多 ${bannerState?.maxCount ?? 3} 张，上传并选用后新游戏会使用该封面`}
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

        <div className="mt-5 border-t border-gray-100" />

        <ThemeImagePicker
          title="应用背景"
          desc={`游戏列表背景，最多 ${bgState?.maxCount ?? 6} 张，可随时切回内置默认`}
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
