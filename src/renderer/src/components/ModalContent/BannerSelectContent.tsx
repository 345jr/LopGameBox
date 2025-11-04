import { useState } from 'react';
import { VscClose, VscFolderOpened, VscAdd } from 'react-icons/vsc';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

interface BannerSelectContentProps {
  onClose: () => void;
  gameId: number;
  gameName: string;
  onSuccess: () => void;
}

const BannerSelectContent = ({ onClose, gameId, gameName, onSuccess }: BannerSelectContentProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [useLink, setUseLink] = useState(false);

  // 处理图片上传逻辑
  const handleBannerUpload = async (imagePath: string) => {
    const targetPath = 'banner/';
    let oldFilePath = (await window.api.getBanners())?.find((i: any) => i.game_id === gameId)
      ?.relative_path as string;

    if (oldFilePath === undefined) oldFilePath = 'skip';

    try {
      setIsLoading(true);
      const result = await window.api.copyImages({
        origin: imagePath,
        target: targetPath,
        gameName: gameName,
        oldFilePath: oldFilePath,
      });
      await window.api.addBanner({
        gameId: gameId,
        imagePath: imagePath,
        relativePath: result.relativePath,
      });
      toast.success('封面图替换成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('封面图替换失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理拖拽进入
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 处理拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 处理拖拽放下
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 处理放下文件
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // 验证是否为图片文件
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      const filePath = (file as any).path;
      await handleBannerUpload(filePath);
    }
  };

  // 处理点击选择文件
  const handleSelectFile = async () => {
    const path = await window.api.openFile();
    if (path) {
      await handleBannerUpload(path);
    }
  };

  // 处理链接提交
  const handleLinkSubmit = async () => {
    if (!linkUrl.trim()) {
      toast.error('请输入链接地址');
      return;
    }

    // 验证URL格式
    try {
      new URL(linkUrl);
    } catch {
      toast.error('请输入有效的链接地址');
      return;
    }

    try {
      setIsLoading(true);
      let oldFilePath = (await window.api.getBanners())?.find((i: any) => i.game_id === gameId)
        ?.relative_path as string;
      if (oldFilePath === undefined) oldFilePath = 'skip';

      await window.api.addBanner({
        gameId: gameId,
        imagePath: linkUrl,
        relativePath: linkUrl,
      });
      toast.success('封面图链接设置成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('封面图链接设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        {/* 标题栏 */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">选择封面图</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            title="关闭"
          >
            <VscClose className="text-2xl" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-6">
          {/* 标签页切换 */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setUseLink(false)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                !useLink
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              本地上传
            </button>
            <button
              onClick={() => setUseLink(true)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                useLink
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              链接嵌入
            </button>
          </div>

          {/* 本地上传模式 */}
          {!useLink && (
            <>
              {/* 拖拽区域 */}
              <motion.div
                className={`relative mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                animate={{
                  borderColor: isDragging ? '#3b82f6' : '#d1d5db',
                  backgroundColor: isDragging ? '#eff6ff' : '#f9fafb',
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center justify-center">
                  <motion.div 
                    className="mb-3 text-5xl text-gray-400"
                    animate={{ scale: isDragging ? 1.2 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VscAdd />
                  </motion.div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? '释放即可上传' : '拖拽图片到此'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">或点击下方按钮选择</p>
                </div>
              </motion.div>

              {/* 文件选择按钮 */}
              <motion.button
                onClick={handleSelectFile}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 text-white font-medium transition hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <VscFolderOpened className="text-xl" />
                <span>{isLoading ? '上传中...' : '从文件夹选择'}</span>
              </motion.button>

              {/* 提示文字 */}
              <p className="mt-4 text-center text-xs text-gray-500">
                支持 JPG、PNG、GIF 等格式的图片
              </p>
            </>
          )}

          {/* 链接嵌入模式 */}
          {useLink && (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  图片链接地址
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-2 text-xs text-gray-500">
                  请输入图片的完整网络地址
                </p>
              </div>

              <motion.button
                onClick={handleLinkSubmit}
                disabled={isLoading || !linkUrl.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 text-white font-medium transition hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span>{isLoading ? '设置中...' : '设置链接'}</span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerSelectContent;
