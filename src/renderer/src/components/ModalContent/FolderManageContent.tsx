import { useState, useEffect } from 'react';
import { VscFolder, VscFolderOpened, VscSave, VscTrash, VscRefresh } from 'react-icons/vsc';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SaveBackup {
  id: number;
  backup_name: string;
  backup_path: string;
  file_size: number;
  created_at: number;
}

interface FolderManageContentProps {
  onClose: () => void;
  gamePath: string;
  gameId: number;
  onOpenFolder: (path: string) => void;
}

const FolderManageContent = ({ onClose, gamePath, gameId, onOpenFolder }: FolderManageContentProps) => {
  const [savePath, setSavePath] = useState<string>('');
  const [savePathSet, setSavePathSet] = useState(false);
  const [saveFileSize, setSaveFileSize] = useState<number>(0);
  const [backups, setBackups] = useState<SaveBackup[]>([]);
  const [loading, setLoading] = useState(false);

  // 组件加载时检查是否已设置存档路径
  useEffect(() => {
    checkSavePath();
  }, [gameId]);

  // 检查存档路径
  const checkSavePath = async () => {
    try {
      const result = await window.api.getGameSavePath(gameId);
      if (result) {
        setSavePath(result.save_path);
        setSaveFileSize(result.file_size);
        setSavePathSet(true);
        // 加载备份列表
        await loadBackups();
      }
    } catch (error) {
      console.error('检查存档路径失败:', error);
    }
  };

  // 加载备份列表
  const loadBackups = async () => {
    try {
      const backupList = await window.api.getSaveBackups(gameId);
      setBackups(backupList);
    } catch (error) {
      console.error('加载备份列表失败:', error);
    }
  };

  // 打开游戏文件夹
  const handleOpenGameFolder = () => {
    onOpenFolder(gamePath);
  };

  // 设置存档文件夹
  const handleSetSavePath = async () => {
    try {
      // 调用系统文件夹选择器
      const selectedPath = await window.api.selectFolder();
      if (selectedPath) {
        // 显示加载提示
        const loadingToast = toast.loading('正在计算存档大小...');
        
        // 计算存档文件夹大小（直接计算文件夹本身）
        const fileSize = await window.api.getFolderSize(selectedPath);
        
        // 保存存档路径到数据库
        await window.api.setGameSavePath(gameId, selectedPath, fileSize);
        
        setSavePath(selectedPath);
        setSaveFileSize(fileSize);
        setSavePathSet(true);
        
        toast.dismiss(loadingToast);
        toast.success('存档路径设置成功');
      }
    } catch (error) {
      console.error('设置存档路径失败:', error);
      toast.error('设置存档路径失败');
    }
  };

  // 打开存档文件夹
  const handleOpenSaveFolder = () => {
    if (savePath) {
      onOpenFolder(savePath);
    }
  };

  // 刷新存档大小
  const handleRefreshSaveSize = async () => {
    if (!savePath) return;
    
    try {
      const loadingToast = toast.loading('正在重新计算存档大小...');
      
      // 重新计算存档文件夹大小（直接计算文件夹本身）
      const fileSize = await window.api.getFolderSize(savePath);
      
      // 更新数据库中的大小
      await window.api.updateSavePathSize(gameId, fileSize);
      
      toast.dismiss(loadingToast);
      toast.success('存档大小已更新');
      
      // 重新加载存档信息
      await checkSavePath();
    } catch (error) {
      console.error('刷新存档大小失败:', error);
      toast.error('刷新存档大小失败');
    }
  };

  // 创建备份
  const handleCreateBackup = async () => {
    if (!savePath) {
      toast.error('请先设置存档路径');
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.createSaveBackup(gameId);
      if (result.success) {
        toast.success(result.message);
        // 重新加载备份列表
        await loadBackups();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      toast.error('备份创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 恢复备份
  const handleRestoreBackup = async (backupId: number) => {
    if (!confirm('确定要恢复此备份吗?当前存档将被覆盖!')) return;
    
    try {
      const loadingToast = toast.loading('正在恢复备份...');
      const result = await window.api.restoreSaveBackup(backupId, gameId);
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(result.message);
        // 刷新存档信息
        await checkSavePath();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('恢复备份失败:', error);
      toast.error('备份恢复失败');
    }
  };

  // 删除备份
  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm('确定要删除此备份吗?')) return;
    
    try {
      const result = await window.api.deleteSaveBackup(backupId);
      if (result.success) {
        toast.success(result.message);
        // 从列表中移除已删除的备份
        setBackups(backups.filter(b => b.id !== backupId));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('删除备份失败:', error);
      toast.error('备份删除失败');
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col"
      >
        {/* 标题栏 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold">文件管理</h2>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 打开游戏文件夹 */}
          <div className="mb-4">
            <button
              onClick={handleOpenGameFolder}
              className="flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <VscFolder className="text-2xl text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">打开游戏文件夹</h3>
                <p className="text-sm text-gray-500">查看游戏文件目录</p>
              </div>
            </button>
          </div>

          {/* 存档管理区域 */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">存档管理</h3>

            {!savePathSet ? (
              /* 未设置存档路径 */
              <div className="flex flex-col items-center justify-center py-8">
                <VscSave className="mb-4 text-6xl text-gray-300" />
                <p className="mb-4 text-gray-500">还未设置存档文件夹</p>
                <button
                  onClick={handleSetSavePath}
                  className="cursor-pointer rounded-lg bg-green-500 px-6 py-2 text-white transition hover:bg-green-600"
                >
                  设置存档文件夹
                </button>
              </div>
            ) : (
              /* 已设置存档路径 */
              <div>
                {/* 存档路径和大小显示 */}
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-gray-500">存档路径</p>
                      <p className="truncate text-sm font-medium text-gray-700" title={savePath}>
                        {savePath}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        大小: {formatSize(saveFileSize)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSetSavePath}
                        className="cursor-pointer rounded-lg bg-green-100 p-2 text-green-600 transition hover:bg-green-200"
                        title="重新设置存档路径"
                      >
                        <VscFolder className="text-xl" />
                      </button>
                      <button
                        onClick={handleRefreshSaveSize}
                        className="cursor-pointer rounded-lg bg-gray-200 p-2 text-gray-600 transition hover:bg-gray-300"
                        title="刷新存档大小"
                      >
                        <VscRefresh className="text-xl" />
                      </button>
                      <button
                        onClick={handleOpenSaveFolder}
                        className="cursor-pointer rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                        title="打开存档文件夹"
                      >
                        <VscFolderOpened className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 备份操作按钮 */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition hover:bg-green-600 disabled:bg-gray-400"
                  >
                    <FiDownload className="text-lg" />
                    {loading ? '创建中...' : '创建备份'}
                  </button>
                  <button
                    onClick={loadBackups}
                    className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
                    title="刷新备份列表"
                  >
                    <VscRefresh className="text-lg" />
                  </button>
                </div>

                {/* 备份列表 */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">备份列表</h4>
                  {backups.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-400">
                      暂无备份,创建第一个备份吧!
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {backups.map((backup) => (
                        <div
                          key={backup.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
                        >
                          {/* 备份图标 */}
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                            <VscSave className="text-xl text-green-600" />
                          </div>

                          {/* 备份信息 */}
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-gray-900" title={backup.backup_name}>
                              {backup.backup_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(backup.created_at)} · {formatSize(backup.file_size)}
                            </p>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRestoreBackup(backup.id)}
                              className="cursor-pointer rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                              title="覆盖当前存档"
                            >
                              <VscRefresh className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(backup.id)}
                              className="cursor-pointer rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                              title="删除备份"
                            >
                              <VscTrash className="text-lg" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮区域 */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition hover:bg-gray-400"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderManageContent;
