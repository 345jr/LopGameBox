import { Link } from 'react-router-dom';
import { FaCircleCheck } from 'react-icons/fa6';
import { FaClock } from 'react-icons/fa6';
import { FaCalendarPlus } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa6";
const Updata = () => {
  return (
    <>
      <div className="p-5">
        <div className="flex flex-col justify-center items-center">
          <div className="text-2xl font-serif">更新记录</div>
        </div>
        {/* 2025年8月3号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="text-2xl mr-5 mt-0.5 text-amber-500" />
            <p className="text-xl font-bold">2025年8月3号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="text-2xl mr-5 mt-1 text-green-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.添加功能:可以给游戏添加封面图</li>
              <li>2.添加功能:引入了react路由,添加2个页面,更新记录，图集页</li>
            </ul>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCalendarPlus className="text-2xl mr-5 mt-1 text-blue-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-blue-200 via-blue-400 to-blue-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.待办事项:完善不同游戏不同图集的功能</li>
              <li>2.待办事项:把游戏的详细数据做成一个模态框，减少主页冗余数据</li>
            </ul>
          </div>
          <div>
            <div className="flex flex-row">
              <FaHeart className="text-2xl mr-5 mt-1 text-red-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-red-200 via-red-400 to-red-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.优化代码:修剪冗余的变量,使代码更加简洁</li>
              <li>2.撰写批注:在关键地方添加注释,增加可读性</li>
            </ul>
          </div>
        </div>
        {/* 2025年8月5号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="text-2xl mr-5 mt-0.5 text-amber-500" />
            <p className="text-xl font-bold">2025年8月5号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="text-2xl mr-5 mt-1 text-green-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.添加功能:可以给游戏添加快照图</li>
            </ul>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCalendarPlus className="text-2xl mr-5 mt-1 text-blue-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-blue-200 via-blue-400 to-blue-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.代办事项:快照图添加删除功能</li>
            </ul>
          </div>
          <div>
            <div className="flex flex-row">
              <FaHeart className="text-2xl mr-5 mt-1 text-red-500" />
              <div className="w-60 h-1 mt-3.5 rounded-r-full bg-gradient-to-l from-red-200 via-red-400 to-red-600"></div>
            </div>
            <ul className="ml-15 font-serif">
              <li>1.优化代码:使用tailwindCSS的配置,简化代码,提高复用性</li>
              <li>2.撰写批注:在关键地方添加注释,增加可读性</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 text-xl">
          <Link to={'/'}>
            <button>返回主页</button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Updata;
