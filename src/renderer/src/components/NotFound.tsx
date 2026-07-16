import React, { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
  const loc = useLocation()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-2 text-6xl leading-none" aria-hidden>
          <span role="img" aria-label="mailbox">
            📭
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-semibold">页面未找到（404）</h1>
        <p className="mb-4 text-sm text-slate-600">
          抱歉，我们找不到你访问的页面。请检查下面的信息或返回其他页面。
        </p>

        <div className="mt-3 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 font-mono text-slate-200">
          <div className="text-xs opacity-90">当前路径</div>
          <div className="mt-1 text-sm">{loc.pathname + (loc.search || '')}</div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            ← 返回
          </button>

          <Link to="/" className="no-underline">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              前往首页
            </button>
          </Link>

          <button
            onClick={handleCopy}
            className="rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-slate-800 hover:bg-slate-200"
          >
            {copied ? '已复制路径' : '复制完整 URL'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
