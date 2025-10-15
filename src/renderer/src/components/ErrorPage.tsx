import React, { useCallback, useState } from 'react';
import { useRouteError, Link, useNavigate } from 'react-router-dom';

function stringifyErr(err: unknown) {
  try {
    if (!err) return String(err);
    if (typeof err === 'string') return err;
    if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack || ''}`;
    return JSON.stringify(err, null, 2);
  } catch (e) {
    return String(err);
  }
}

const ErrorPage: React.FC = () => {
  const err = useRouteError();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const text = stringifyErr(err);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setCopied(false);
    }
  }, [err]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const errorText = stringifyErr(err);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl leading-none mb-2" aria-hidden>
          <span role="img" aria-label="error">⚠️</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2">应用发生错误</h1>
        <p className="text-sm text-slate-600 mb-4">
          抱歉，应用在渲染时发生了未处理的异常。你可以复制下面的错误信息以便反馈。
        </p>

        <div className="mt-3 px-3 py-2 bg-slate-900 text-slate-200 rounded-md font-mono text-sm whitespace-pre-wrap text-left overflow-x-auto max-h-40">
          {errorText || '（无错误详情）'}
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
            ← 返回
          </button>

          <Link to="/" className="no-underline">
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              前往首页
            </button>
          </Link>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-md bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200">
            {copied ? '已复制错误' : '复制错误信息'}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          若需进一步调试，请在开发模式下打开控制台查看完整堆栈。
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
