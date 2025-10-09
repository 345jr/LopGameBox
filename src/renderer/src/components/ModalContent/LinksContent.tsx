import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface LinkMetadata {
  title: string;
  description: string;
  favicon: string;
  url: string;
}

interface LinkItem {
  id: number;
  game_id: number;
  url: string;
  title: string;
  description: string;
  icon: string;
  created_at: number;
  updated_at: number;
}

const LinksContent = ({ onClose, gameId }: { onClose: () => void; gameId: number }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [fetchingLinks, setFetchingLinks] = useState(false);

  // 获取元数据
  const handleFetchMetadata = async () => {
    if (!url.trim()) {
      toast.error('请输入URL');
      return;
    }

    // 简单的URL验证
    try {
      new URL(url);
    } catch {
      toast.error('请输入有效的URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://lopbox.lopop.top/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('获取元数据失败');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const metadata: LinkMetadata = {
          title: result.data.title || result.data.ogTitle || '无标题',
          description: result.data.description || result.data.ogDescription || '',
          favicon: result.data.favicon || '',
          url: result.data.url || url,
        };

        // 调用后端API保存链接
        await saveLinkToDatabase(metadata);
        
        // 清空输入框
        setUrl('');
        
        // 重新获取链接列表
        fetchLinks();
      } else {
        toast.error(result.message || '获取元数据失败');
      }
    } catch (error) {
      console.error('获取元数据失败:', error);
      toast.error(error instanceof Error ? error.message : '获取元数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存链接到数据库
  const saveLinkToDatabase = async (metadata: LinkMetadata) => {
    try {
      await window.api.addGameLink(gameId, metadata);
      toast.success('链接添加成功');
    } catch (error) {
      console.error('保存链接失败:', error);
      toast.error('保存链接失败');
      throw error;
    }
  };

  // 获取游戏的所有链接
  const fetchLinks = async () => {
    setFetchingLinks(true);
    try {
      const data = await window.api.getGameLinks(gameId);
      setLinks(data);
    } catch (error) {
      console.error('获取链接列表失败:', error);
      toast.error('获取链接列表失败');
    } finally {
      setFetchingLinks(false);
    }
  };

  // 删除链接
  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('确定要删除这个链接吗?')) return;

    try {
      await window.api.deleteGameLink(linkId);
      toast.success('删除成功');
      fetchLinks();
    } catch (error) {
      console.error('删除链接失败:', error);
      toast.error('删除链接失败');
    }
  };

  // 组件挂载时获取链接列表
  useEffect(() => {
    if (gameId) {
      fetchLinks();
    }
  }, [gameId]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-xl font-bold">外链管理</h2>

        {/* 添加链接区域 */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            添加网页链接
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入网页URL (例: https://store.steampowered.com/...)"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleFetchMetadata();
                }
              }}
            />
            <button
              onClick={handleFetchMetadata}
              disabled={loading}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '获取中...' : '添加'}
            </button>
          </div>
        </div>

        {/* 链接列表 */}
        <div className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">已添加的链接</h3>
          
          {fetchingLinks ? (
            <div className="text-center text-gray-500">加载中...</div>
          ) : links.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-400">
              暂无链接,添加第一个吧!
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
                >
                  {/* 图标 */}
                  {link.icon ? (
                    <img
                      src={link.icon}
                      alt="icon"
                      className="h-8 w-8 flex-shrink-0 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 flex-shrink-0 rounded bg-gray-200" />
                  )}

                  {/* 标题(可点击跳转) */}
                  <div className="flex-1 overflow-hidden">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium text-gray-900 transition hover:text-blue-600 hover:underline"
                      title={link.url}
                    >
                      {link.title}
                    </a>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="flex-shrink-0 text-red-500 transition hover:text-red-700"
                    title="删除"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition hover:bg-gray-400"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinksContent;
