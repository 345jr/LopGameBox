import { Link } from 'react-router-dom';
import { FaArrowDown, FaAlignRight, FaChartSimple } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import logo from '../assets/lopgame.png';
const NavHeader = ({ AddGame }) => {
  return (
    <div className="items-centers flex justify-start border-b-1 border-black p-2">
      <img src={logo} alt="logo" className="mr-5 w-12 rounded-full" />
      {/* 添加游戏 */}
      <button
        onClick={AddGame}
        className="flex cursor-pointer flex-row items-center justify-center px-2"
      >
        <FaArrowDown className="mt-0.5 mr-1 text-2xl text-lime-500 hover:text-lime-600" />
        添加游戏
      </button>

      {/* 统计面板 */}
      <Link
        to={'/updata'}
        className="flex flex-row items-center justify-center px-2"
      >
        <FaChartSimple className="mt-0.5 mr-1 text-2xl text-lime-500 hover:text-lime-600" />
        <button className="cursor-pointer">统计面板</button>
      </Link>

      {/* 更新记录 */}
      <Link
        to={'/updata'}
        className="flex flex-row items-center justify-center px-2"
      >
        <FaAlignRight className="mt-0.5 mr-1 text-2xl text-lime-500 hover:text-lime-600" />
        <button className="cursor-pointer">更新记录</button>
      </Link>

      {/* 搜索框 */}
      <div className="relative flex flex-row">
        <div className="mt-2 ml-5 flex h-8 w-40 flex-col items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm">
          <input
            type="text"
            placeholder="搜索"
            className="w-40 p-5 text-gray-700 focus:outline-none"
          />
        </div>
        <button className="absolute top-3.5 right-1.5 cursor-pointer">
          <FaSearch className="text-xl text-lime-500 hover:text-lime-600"/>
        </button>
      </div>

    </div>
  );
};

export default NavHeader;
