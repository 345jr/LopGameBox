import { useRef, useState } from 'react';
import { VscPassFilled, VscFiles, VscArrowRight, VscClose } from 'react-icons/vsc';
import { motion } from 'motion/react';

import { Game, GameVersion } from '@renderer/types/Game';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import useInfoStore from '@renderer/store/infoStore';
import { Button, Modal } from 'antd';

export default function ModalContent({
  onClose,
  gameId,
  updata,
}: {
  onClose: () => void;
  gameId: number;
  updata: React.Dispatch<React.SetStateAction<any>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState<number>(0);

  // 模拟版本数据，实际应该从API获取
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([
    {
      id: 1,
      game_id: gameId,
      version: '1.0',
      description: '初始版本，包含基础功能',
      release_date: Date.now() - 30 * 24 * 60 * 60 * 1000,
      created_at: Date.now() - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 2,
      game_id: gameId,
      version: '1.1',
      description: '修复了若干bug，优化了性能',
      release_date: Date.now() - 15 * 24 * 60 * 60 * 1000,
      created_at: Date.now() - 15 * 24 * 60 * 60 * 1000
    },
    {
      id: 3,
      game_id: gameId,
      version: '2.0',
      description: '重大更新：新增多个功能模块，UI全面升级',
      release_date: Date.now(),
      created_at: Date.now()
    }
  ]);

  const [selectedVersion, setSelectedVersion] = useState<GameVersion | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const setInfo = useInfoStore((state) => state.setInfo);
  
  // 打开版本详情模态框
  const handleVersionClick = (version: GameVersion) => {
    setSelectedVersion(version);
    setIsVersionModalOpen(true);
  };

  // 关闭版本详情模态框
  const handleVersionModalClose = () => {
    setIsVersionModalOpen(false);
    setSelectedVersion(null);
  };
  //修改游戏名
  const handleConfirm = async () => {
    const newName = inputRef.current?.value;
    if (newName) {
      // 调用修改游戏名的API
      await window.api.modifyGameName(gameId, newName);
      //重新获取数据
      const gameList = await window.api.getAllGames();
      updata(gameList);
      onClose();
      setInfo(`游戏名已修改为: ${newName}`);
    } else {
      onClose();
      setInfo(`游戏名不能为空!`);
    }
  };
  //重新计算游戏大小
  const handleGetGameSize = async (gameId: number) => {
    const game: Game = await window.api.getGameById(gameId);
    //更新游戏大小
    const newSize = await window.api.updateGameSize(gameId, game.launch_path);
    setSize(newSize);
    //重新获取数据
    const newGameList = await window.api.getAllGames();
    updata(newGameList);
  };
  return (
    // 遮罩层
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30"
      onClick={onClose}
    >
      {/* 模态框主体 */}
      <div
        className="relative mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-2xl font-semibold text-gray-800">配置区域</p>
        {/* 修改游戏名 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div>
              <p className="py-2 text-lg">修改游戏名</p>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="点击右侧保存"
                  className="mb-1 w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button onClick={handleConfirm} className="absolute top-1.5 right-2 cursor-pointer">
                  <VscPassFilled className="text-3xl text-lime-500" />
                </button>
              </div>
            </div>
            {/* 重新扫描游戏大小 */}
            <div className="flex flex-row">
              <p className="py-2 text-lg">重新计算游戏大小</p>
              <VscArrowRight className="mx-2 mt-2.5 text-2xl" />
              <motion.button
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.5, color: '#fcad03' }}
                onClick={() => handleGetGameSize(gameId)}
              >
                <VscFiles className="cursor-pointer text-2xl" />
              </motion.button>
              {/* 展示新的游戏大小 */}
              {size > 0 && (
                <>
                  <VscArrowRight className="mx-2 mt-2.5 text-2xl" />
                  <p className="mt-2.5 ml-2 text-lg text-black">游戏大小:{gameSizeFormat(size)}</p>
                </>
              )}
            </div>
          </div>
          {/* 版本管理 */}
          <div>
            <p className="py-2 text-lg text-center">更新版本记录</p>
            <div className="flex flex-row gap-4 justify-center">
              <Button color="primary" variant="filled">
                大更新
              </Button>
              <Button color="primary" variant="filled">
                小更新
              </Button>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-lg font-semibold">版本列表:</p>
              {gameVersions && gameVersions.length > 0 ? (
                <div className="space-y-1">
                  {gameVersions.map((version) => (
                    <div
                      key={version.id}
                      className="flex cursor-pointer items-center justify-between py-1 transition-colors hover:text-blue-600"
                      onClick={() => handleVersionClick(version)}
                    >
                      <span className="font-medium">版本 {version.version}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(version.release_date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无版本记录</p>
              )}
            </div>
          </div>
        </div>

        {/* 版本详情模态框 */}
        <Modal
          title={`版本 ${selectedVersion?.version} 详情`}
          open={isVersionModalOpen}
          onCancel={handleVersionModalClose}
          footer={[
            <Button key="close" onClick={handleVersionModalClose}>
              关闭
            </Button>
          ]}
          width={600}
        >
          {selectedVersion && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-700">版本号:</p>
                <p className="text-gray-900">{selectedVersion.version}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">发布日期:</p>
                <p className="text-gray-900">
                  {new Date(selectedVersion.release_date).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">版本描述:</p>
                <p className="text-gray-900">{selectedVersion.description}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">创建时间:</p>
                <p className="text-gray-900">
                  {new Date(selectedVersion.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          )}
        </Modal>
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="transform cursor-pointer rounded px-4 py-2 text-gray-800 transition duration-200 ease-in-out hover:text-red-500"
          >
            <VscClose className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
