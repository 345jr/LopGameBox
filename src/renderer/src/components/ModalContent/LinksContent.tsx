import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useFetchMetadata,
  useGameLinks,
  useAddGameLink,
  useUpdateGameLink,
  useDeleteGameLink,
} from '@renderer/api/queries';

import linkIcon from '@renderer/assets/link.png';

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
  
  // 编辑模态框状态
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    linkId: number;
    title: string;
    url: string;
  }>({
    isOpen: false,
    linkId: 0,
    title: '',
    url: '',
  });

  const { data: links = [], isLoading: fetchingLinks } = useGameLinks(gameId);

  const addLinkMutation = useAddGameLink();
  const updateLinkMutation = useUpdateGameLink();
  const deleteLinkMutation = useDeleteGameLink();

  // 获取元数据
  const {
    refetch: fetchMetadataQuery,
    isFetching: fetchingMetadata,
  } = useFetchMetadata(url, false); 

  const LOCAL_FAVICON_PLACEHOLDER = linkIcon;

  // 判断favicon是否为网图否则采用本地占位
  const resolveFavicon = (fav: string | undefined | null): string => {
    const v = (fav || '').trim();
    if (!v) return LOCAL_FAVICON_PLACEHOLDER;

    // 仅当非 http/https 且非 data: 才判定为需要替换
    const isHttp = /^https?:\/\//i.test(v);
    const isData = /^data:/i.test(v);
    if (isHttp || isData) return v;

    // 命中诸如 /favicon.ico、/favicon-32x32.png、favicon.svg、C:\\... 等非网图路径时替换
    return LOCAL_FAVICON_PLACEHOLDER;
  };

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

    toast.promise(
      (async () => {
        // 手动触发元数据查询
        const { data: result } = await fetchMetadataQuery();
        const payload: any = result && (result as any).data ? (result as any).data : result;

        if (payload && (payload.title || payload.ogTitle || payload.url || payload.description || payload.ogDescription)) {
          const metadata: LinkMetadata = {
            title: payload.title || payload.ogTitle || '无标题',
            description: payload.description || payload.ogDescription || '',
            favicon: resolveFavicon(payload.favicon),
            url: payload.url || url,
          };
          // 保存链接
          await addLinkMutation.mutateAsync({
            gameId,
            metadata,
          });
          // 清空输入框
          setUrl('');
          return metadata;
        }

        const message = (result as any)?.message || (result as any)?.error || '获取元数据失败';
        throw new Error(message);
      })(),
      {
        loading: '正在添加链接...',
        success: '链接添加成功！',
        error: (err) => `添加失败: ${err instanceof Error ? err.message : '未知错误'}`,
      }
    );
  };

  // 删除链接
  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('确定要删除这个链接吗?')) return;

    toast.promise(
      deleteLinkMutation.mutateAsync({ linkId, gameId }),
      {
        loading: '正在删除...',
        success: '删除成功！',
        error: (err) => `删除失败: ${err instanceof Error ? err.message : '未知错误'}`,
      }
    );
  };

  // 打开编辑模态框
  const handleOpenEdit = (link: LinkItem) => {
    setEditModal({
      isOpen: true,
      linkId: link.id,
      title: link.title,
      url: link.url,
    });
  };

  // 关闭编辑模态框
  const handleCloseEdit = () => {
    setEditModal({
      isOpen: false,
      linkId: 0,
      title: '',
      url: '',
    });
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editModal.isOpen) return;

    if (!editModal.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (!editModal.url.trim()) {
      toast.error('请输入URL');
      return;
    }

    // URL验证
    try {
      new URL(editModal.url);
    } catch {
      toast.error('请输入有效的URL');
      return;
    }

    toast.promise(
      updateLinkMutation.mutateAsync({
        linkId: editModal.linkId,
        title: editModal.title.trim(),
        url: editModal.url.trim(),
        gameId,
      }),
      {
        loading: '正在更新...',
        success: () => {
          handleCloseEdit();
          return '更新成功！';
        },
        error: (err) => `更新失败: ${err instanceof Error ? err.message : '未知错误'}`,
      }
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-xl font-bold">链接管理</h2>

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
              placeholder="输入网页URL"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFetchMetadata();
                }
              }}
            />
            <button
              onClick={handleFetchMetadata}
              disabled={addLinkMutation.isPending || fetchingMetadata}
              className="cursor-pointer rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600 disabled:bg-gray-400"
            >
              {addLinkMutation.isPending || fetchingMetadata ? '添加中...' : '添加'}
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

                  {/* 编辑按钮 */}
                  <button
                    onClick={() => handleOpenEdit(link)}
                    className="cursor-pointer flex-shrink-0 text-blue-500 transition hover:text-blue-700"
                    title="编辑"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="cursor-pointer flex-shrink-0 text-red-500 transition hover:text-red-700"
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
            className="cursor-pointer rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition hover:bg-gray-400"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 编辑链接模态框 */}
      {editModal.isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡到外层模态框
            handleCloseEdit();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-xl font-bold">编辑链接</h2>
            
            <div className="space-y-4">
              {/* 标题输入 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  标题
                </label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="输入标题"
                  autoFocus
                />
              </div>

              {/* URL输入 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  链接地址
                </label>
                <input
                  type="text"
                  value={editModal.url}
                  onChange={(e) => setEditModal({ ...editModal, url: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="输入URL"
                />
              </div>

              {/* 按钮组 */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="cursor-pointer flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={handleCloseEdit}
                  className="cursor-pointer flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksContent;
