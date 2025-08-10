import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { VscTriangleDown, VscComment } from 'react-icons/vsc';
import { motion } from 'framer-motion';
import { useState } from 'react';

import logo from '../assets/lopgame.png';
import useInfoStore from '@renderer/store/infoStore';
import useGameStore from '@renderer/store/GameStore';
import { formatTime } from '@renderer/util/timeFormat';

const NavHeader = () => {
  const [position, setPosition] = useState({ x: 0, y: 0, rotate: 0 });
  const [inputRef, setInputRef] = useState<string>('');
  const [grab, setGrab] = useState<boolean>(false);
  //状态管理 --
  const info = useInfoStore((state) => state.info);
  const setGameList = useGameStore((state) => state.setGameList);
  const gameTime = useGameStore((state) => state.gameTime);
  const gameState = useGameStore((state) => state.gameState);
  const onInfo = useInfoStore((state) => state.onInfo);
  const offInfo = useInfoStore((state) => state.offInfo);
  //获取添加信息 --
  const setInfo = useInfoStore((state) => state.setInfo);
  //添加游戏 --
  const handleAddGame = async () => {
    const path = await window.api.openFile();
    if (!path) return;
    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏';
    const defaultPath = `banner\\default.jpg`;
    try {
      const gameInitData = await window.api.addGame({
        gameName: defaultName,
        launchPath: path,
      });
      // 添加默认封面图
      await window.api.addBanner({
        gameId: gameInitData.id,
        imagePath: 'null',
        relativePath: defaultPath,
      });
      setInfo(`${defaultName} 已添加`);
      setGameList(gameInitData.id);
    } catch (error: any) {
      console.log(`${error.message}`);
    }
  };
  // #region 动画 --
  const divVariants = {
    initial: {},
    hover: {},
  };
  const pVariants = {
    initial: {
      scaleX: 0,
    },
    hover: {
      scaleX: 10,
      transition: { duration: 0.3 },
    },
  };
  const iconVariants = {
    initial: { rotate: 0 },
    hover: {
      rotate: 15,
    },
  };
  // #endregion

  //处理字符串
  function truncateString(str: string | undefined, maxLength: number): string {
    if (!str) return '「暂无信息」';
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength) + '...';
  }
  // 处理鼠标按下事件
  const handleMouseDown = () => {
    setGrab(true);
    onInfo();
  };
  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    setGrab(false);
    offInfo();
  };
  return (
    <div className="items-centers flex justify-start border-b-1 border-black">
      <img src={logo} alt="logo" className="mr-5 w-12 rounded-full" />

      <div className="relative flex w-full flex-row">
        {/* 动画指针 */}
        <motion.div
          className="absolute bottom-9 left-8 z-50"
          animate={position}
        >
          <VscTriangleDown />
        </motion.div>
        {/* 添加游戏 */}
        <motion.button
          onClick={handleAddGame}
          className="flex cursor-pointer flex-row items-center justify-center px-2 text-stone-900 hover:text-stone-600"
          whileHover={{ scale: 1.3 }}
          onMouseMove={() => {
            setPosition({ x: 0, y: 0, rotate: 0 });
          }}
        >
          添加游戏
        </motion.button>

        {/* 统计面板 */}

        <motion.div className="mt-3" whileHover={{ scale: 1.3 }}>
          <Link
            to={'/updata'}
            className="flex cursor-pointer flex-row items-center justify-center px-2 text-stone-900 hover:text-stone-600"
            onMouseMove={() => {
              setPosition({ x: 80, y: 0, rotate: 0 });
            }}
          >
            统计面板
          </Link>
        </motion.div>

        {/* 更新记录 */}
        <motion.div className="mt-3" whileHover={{ scale: 1.3 }}>
          <Link
            to={'/update'}
            className="flex cursor-pointer flex-row items-center justify-center px-2 text-stone-900 hover:text-stone-600"
            onMouseMove={() => {
              setPosition({ x: 160, y: 0, rotate: 0 });
            }}
          >
            更新记录
          </Link>
        </motion.div>
        {/* 搜索区域 */}
        <motion.div
          className="relative flex flex-row"
          onMouseEnter={() => {
            setPosition({ x: 235, y: 20, rotate: -90 });
          }}
        >
          <div
            className={`mt-2 ml-5 flex h-8 w-40 flex-col items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm`}
          >
            <input
              type="text"
              className={`w-25 text-gray-700 focus:outline-none`}
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
            />
          </div>
          <button className="absolute top-3.5 right-1.5 cursor-pointer text-stone-900 hover:text-stone-600">
            <FaSearch className="text-xl" />
          </button>
        </motion.div>

        {/* 状态通知 */}
        <motion.div
          className={`ml-5 flex flex-row items-center text-center ${grab ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseEnter={() => setPosition({ x: 430, y: 20, rotate: -90 })}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          variants={divVariants}
          whileHover="hover"
          initial="initial"
        >
          <div className="relative flex flex-row items-center text-center">
            <motion.div variants={iconVariants}>
              <VscComment className="mr-5 text-2xl" />
            </motion.div>
            <p className="">{truncateString(info?.toString(), 14)}</p>
            <motion.div
              variants={pVariants}
              className="absolute bottom-0 left-30 h-0.5 w-5 bg-black"
            ></motion.div>
          </div>
        </motion.div>
        {/* 游戏运行状态状态 */}
        <div className="absolute top-0 right-0 flex flex-col items-center border-l-2 border-dashed border-l-black">
          <div className="relative p-2">
            {gameState === 'run' ? (
              <>
                <p className="text-xs">
                  {formatTime(gameTime) && '游戏运行中'}
                </p>
                <p>{formatTime(gameTime) || '...'}</p>
                <span className="absolute top-1.5 right-1.5 inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </>
            ) : gameState === 'stop' ? (
              <>
                <p className="text-xs">{formatTime(gameTime) && '游戏结束'}</p>
                <p>
                  {formatTime(gameTime) || '...'}
                  <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs">暂无游戏运行</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavHeader;
