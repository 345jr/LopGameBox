import { useRef, useState } from 'react';
import { VscPassFilled, VscFiles, VscArrowRight } from 'react-icons/vsc';
import { motion } from 'motion/react';

import { Game } from '@renderer/types/Game';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import useInfoStore from '@renderer/store/infoStore';

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

  const setInfo = useInfoStore((state) => state.setInfo);
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
        className="mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-2xl font-semibold text-gray-800">配置区域</p>
        <p className="py-2 text-lg">修改游戏名</p>
        {/* 修改游戏名 */}
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
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 text-gray-800 transition hover:bg-gray-400"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
