import { useState, useEffect } from 'react';
import { VscFolder, VscFolderOpened, VscSave, VscTrash, VscRefresh, VscClose } from 'react-icons/vsc';
import { GoGitPullRequest,GoGitBranch,GoDotFill,GoDot } from "react-icons/go";
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

import  formatFileSize  from '@renderer/util/gameSizeFormat';
import { formatTimeCalender } from '@renderer/util/timeFormat';

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
}

const FolderManageContent = ({ onClose, gamePath, gameId }: FolderManageContentProps) => {
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
      toast.error('无法获取存档路径信息');
    }
  };

  // 加载备份列表
  const loadBackups = async () => {
    try {
      const backupList = await window.api.getSaveBackups(gameId);
      setBackups(backupList);
    } catch (error) {
      console.error('加载备份列表失败:', error);
      toast.error('无法加载备份列表');
    }
  };

  // 打开游戏文件夹
  const handleOpenGameFolder = async () => {
    try {
      await window.api.openFolder(gamePath);
    } catch (error) {
      console.error('打开游戏文件夹失败:', error);
      toast.error('无法打开游戏文件夹');
    }
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
      try {
        window.api.openFolder(savePath);
      } catch (error) {
        console.error('打开存档文件夹失败:', error);
        toast.error('无法打开存档文件夹');
      }
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
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">文件管理</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            title="关闭"
          >
            <VscClose className="text-2xl" />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 快捷操作按钮 */}
          {!savePathSet ? (
            /* 未设置存档时 - 只显示打开游戏文件夹 */
            <div className="mb-4">
              <button
                onClick={handleOpenGameFolder}
                className="w-full flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <VscFolder className="text-2xl text-gray-700" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900">打开游戏文件夹</h3>
                  <p className="text-sm text-gray-500">查看游戏文件目录</p>
                </div>
              </button>
            </div>
          ) : (
            /* 已设置存档时 - 显示所有按钮 */
            <div className="mb-4 space-y-4">
              {/* 第一排 - 2个文件夹按钮各占一半 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 打开游戏文件夹 */}
                <button
                  onClick={handleOpenGameFolder}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <VscFolder className="text-2xl text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">打开游戏文件夹</h3>
                    <p className="text-sm text-gray-500">查看游戏文件目录</p>
                  </div>
                </button>

                {/* 打开存档文件夹 */}
                <button
                  onClick={handleOpenSaveFolder}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <VscFolderOpened className="text-2xl text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">打开存档文件夹</h3>
                    <p className="text-sm text-gray-500">查看存档文件</p>
                  </div>
                </button>
              </div>

              {/* 第二排 - 3个操作按钮平均分配 */}
              <div className="grid grid-cols-3 gap-4">
                {/* 重新设置存档路径 */}
                <button
                  onClick={handleSetSavePath}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <GoGitBranch className="text-2xl text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">重新设置存档</h3>
                    <p className="text-sm text-gray-500">更改存档位置</p>
                  </div>
                </button>

                {/* 刷新存档大小 */}
                <button
                  onClick={handleRefreshSaveSize}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <VscRefresh className="text-2xl text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">刷新存档大小</h3>
                    <p className="text-sm text-gray-500">重新计算大小</p>
                  </div>
                </button>

                {/* 创建备份 */}
                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-400 hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <FiDownload className="text-2xl text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">
                      {loading ? '创建中...' : '创建备份'}
                    </h3>
                    <p className="text-sm text-gray-500">备份当前存档</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          <h3 className="mb-4 text-lg font-semibold text-gray-900">存档管理</h3>
          {/* 存档管理区域 */}
          <div className="rounded-lg border border-gray-200 p-4">
              <div className='flex flex-row items-center gap-2'>
                <h3 className="mb-4 text-base font-semibold text-gray-900">主存档</h3>
                <GoDotFill className="mb-4 text-lg" />
              </div>
            {!savePathSet ? (
              /* 未设置存档路径 */
              <div className="flex flex-col items-center justify-center py-8">
                <VscSave className="mb-4 text-6xl text-gray-300" />
                <p className="mb-4 text-gray-500">还未设置存档文件夹</p>
                <button
                  onClick={handleSetSavePath}
                  className="cursor-pointer rounded-lg bg-gray-800 px-6 py-2 text-white transition hover:bg-gray-700"
                >
                  设置存档文件夹
                </button>
              </div>
            ) : (
              /* 已设置存档路径 */
              <div>
                {/* 存档路径和大小显示 */}
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm">
                  {/* 存档图标 */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <VscSave className="text-xl text-gray-700" />
                  </div>

                  {/* 存档信息 */}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs text-gray-500" title={savePath}>
                      {savePath}
                    </p>
                    <p className="text-xs text-gray-500">
                      大小: {formatFileSize(saveFileSize)}
                    </p>
                  </div>
                </div>

                {/* 备份列表 */}
                <div>
                  <div className='flex flex-row items-center gap-2'>
                    <h4 className="mb-4 text-base font-semibold text-gray-900">备份存档</h4>
                    <GoDot className="mb-4 text-lg" />
                  </div>
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
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <VscSave className="text-xl text-gray-700" />
                          </div>

                          {/* 备份信息 */}
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-gray-900" title={backup.backup_name}>
                              {backup.backup_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeCalender(backup.created_at)} · {formatFileSize(backup.file_size)}
                            </p>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRestoreBackup(backup.id)}
                              className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200"
                              title="覆盖当前存档"
                            >
                              <GoGitPullRequest className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(backup.id)}
                              className="cursor-pointer rounded-lg bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200"
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
      </div>
    </div>
  );
};

export default FolderManageContent;
