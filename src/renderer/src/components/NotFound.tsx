import React, { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setCopied(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl leading-none mb-2" aria-hidden>
          <span role="img" aria-label="mailbox">📭</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2">页面未找到（404）</h1>
        <p className="text-sm text-slate-600 mb-4">
          抱歉，我们找不到你访问的页面。请检查下面的信息或返回其他页面。
        </p>

        <div className="mt-3 px-3 py-2 bg-slate-900 text-slate-200 rounded-md font-mono overflow-x-auto">
          <div className="text-xs opacity-90">当前路径</div>
          <div className="mt-1 text-sm">{loc.pathname + (loc.search || '')}</div>
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
            {copied ? '已复制路径' : '复制完整 URL'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
