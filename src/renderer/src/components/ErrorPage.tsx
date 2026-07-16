import React, { useCallback, useState } from 'react'
import { useRouteError, Link, useNavigate } from 'react-router-dom'

function stringifyErr(err: unknown) {
  try {
    if (!err) return String(err)
    if (typeof err === 'string') return err
    if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack || ''}`
    return JSON.stringify(err, null, 2)
  } catch {
    return String(err)
  }
}

const ErrorPage: React.FC = () => {
  const err = useRouteError()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      const text = stringifyErr(err)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }, [err])

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const errorText = stringifyErr(err)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-2 text-6xl leading-none" aria-hidden>
          <span role="img" aria-label="error">
            ⚠️
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-semibold">应用发生错误</h1>
        <p className="mb-4 text-sm text-slate-600">
          抱歉，应用在渲染时发生了未处理的异常。你可以复制下面的错误信息以便反馈。
        </p>

        <div className="mt-3 max-h-40 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 text-left font-mono text-sm whitespace-pre-wrap text-slate-200">
          {errorText || '（无错误详情）'}
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
            {copied ? '已复制错误' : '复制错误信息'}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          若需进一步调试，请在开发模式下打开控制台查看完整堆栈。
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
