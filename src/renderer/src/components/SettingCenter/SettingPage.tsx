import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

/**
 * 本地设置页：仅保留不依赖远端服务的功能。
 */
const SettingPage = () => {
  const [screenshotEnabled, setScreenshotEnabled] = useState(false)

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

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">设置中心</h1>

      <div className="max-w-xl space-y-4">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">本地功能</h2>
          <p className="mb-4 text-sm text-gray-500">
            本应用为纯本地工具，不依赖任何在线账号或云服务。
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
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
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">其他</h2>
          <Link
            to="/setting/update"
            className="inline-block rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
          >
            查看更新记录
          </Link>
        </section>
      </div>
    </div>
  )
}

export default SettingPage
