import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { VscTriangleDown } from 'react-icons/vsc';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

import logo from '../assets/lopgame.png';
const NavHeader = ({ AddGame }) => {
  const [position, setPosition] = useState( {x: 0, y: 0,rotate :0 });
 const [inputRef, setInputRef] = useState<string>('');
  return (
    <div className="items-centers flex justify-start border-b-1 border-black p-2">
      <img src={logo} alt="logo" className="mr-5 w-12 rounded-full" />

      <div className="relative flex flex-row">
        {/* 动画指针 */}
        <motion.div className="absolute bottom-9 left-8 z-50" animate={position}>
          <VscTriangleDown  />
        </motion.div>
        {/* 添加游戏 */}
        <motion.button
          onClick={AddGame}
          className="flex cursor-pointer flex-row items-center justify-center px-2 text-stone-900 hover:text-stone-600"
          whileHover={{ scale: 1.3 }}
          onMouseMove={() => {
            setPosition({ x: 0, y: 0,rotate :0 });
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
              setPosition({ x: 80, y: 0,rotate :0 });
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
              setPosition({ x: 160, y: 0,rotate :0 });
            }}
          >
            更新记录
          </Link>
        </motion.div>
        {/* 搜索区域 */}
        <motion.div className="relative flex flex-row"
          onMouseEnter={() => {
            setPosition({ x: 235, y: 20,rotate :-90 });
          }}>
          <div className={`w-40 mt-2 ml-5 flex h-8  flex-col items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm`}>
            <input
              type="text"
              className={`text-gray-700 focus:outline-none w-25`}
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
            />
          </div>
          <button className="absolute top-3.5 right-1.5 cursor-pointer text-stone-900 hover:text-stone-600">
            <FaSearch className="text-xl" />
          </button>
        </motion.div>
      </div>

      {/* <Link to={'/playground'}>练习</Link> */}
    </div>
  );
};

export default NavHeader;
