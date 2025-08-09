import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { VscTriangleDown } from 'react-icons/vsc';
import { motion } from 'framer-motion';
import { useState } from 'react';

import logo from '../assets/lopgame.png';
import useInfoStore from '@renderer/store/infoStore';
import useGameStore from '@renderer/store/GameStore';

const NavHeader = () => {
  const [position, setPosition] = useState({ x: 0, y: 0, rotate: 0 });
  const [inputRef, setInputRef] = useState<string>('');
  //状态管理 --
  const info = useInfoStore((state) => state.info);
  const setGameList = useGameStore((state) => state.setGameList);
  //获取添加信息 --
  const setInfo = useInfoStore((state) => state.setInfo);
  //添加游戏 --
  const handleAddGame = async () => {
    const path = await window.api.openFile();
    if (!path) return;
    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏';
    const defaultPath = `banner\\default.jpg`;
    try {
      const gameInitData = await window.api.addGame({ gameName: defaultName, launchPath: path });
      // 添加默认封面图
      await window.api.addBanner({gameId: gameInitData.id, imagePath: 'null', relativePath: defaultPath});
      setInfo(`${defaultName} 已添加`);
      setGameList(gameInitData.id); 
    } catch (error: any) {
      console.log(`${error.message}`)
    }
  };

  return (
    <div className="items-centers flex justify-start border-b-1 border-black p-2">
      <img src={logo} alt="logo" className="mr-5 w-12 rounded-full" />

      <div className="relative flex flex-row">
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
        <div className='flex flex-row text-center items-center ml-5'>
          <p>{info || '「目前没有信息」'}</p>
        </div>
      </div>

      {/* <Link to={'/playground'}>练习</Link> */}
    </div>
  );
};

export default NavHeader;
