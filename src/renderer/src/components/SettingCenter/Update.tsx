import { Link } from 'react-router-dom';
import { FaCircleCheck } from 'react-icons/fa6';
import { FaClock } from 'react-icons/fa6';
const Updata = () => {
  return (
    <>
      <div className="p-5">
        <div className="flex-center flex-col">
          <div className="text-2xl">更新记录</div>
        </div>
        {/* 2025年8月3号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="mt-0.5 mr-5 text-2xl text-amber-500" />
            <p className="text-xl font-bold">2025年8月3号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="mt-1 mr-5 text-2xl text-green-500" />
              <div className="mt-3.5 h-1 w-60 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15">
              <li>1.添加功能:可以给游戏添加封面图</li>
              <li>2.添加功能:引入了react路由,添加2个页面,更新记录，图集页</li>
              <li>3.优化代码:修剪冗余的变量,使代码更加简洁</li>
              <li>4.撰写批注:在关键地方添加注释,增加可读性</li>
            </ul>
          </div>
        </div>
        {/* 2025年8月5号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="mt-0.5 mr-5 text-2xl text-amber-500" />
            <p className="text-xl font-bold">2025年8月5号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="mt-1 mr-5 text-2xl text-green-500" />
              <div className="mt-3.5 h-1 w-60 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15">
              <li>1.添加功能:可以给游戏添加快照图</li>
              <li>2.优化代码:使用tailwindCSS的配置,简化代码,提高复用性</li>
              <li>3.撰写批注:在关键地方添加注释,增加可读性</li>
            </ul>
          </div>
        </div>
        {/* 2025年8月10号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="mt-0.5 mr-5 text-2xl text-amber-500" />
            <p className="text-xl font-bold">2025年8月10号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="mt-1 mr-5 text-2xl text-green-500" />
              <div className="mt-3.5 h-1 w-60 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15">
              <li>
                1.添加功能:新增游戏状态,新增可以打开文件夹,新增了重新计算游戏大小,新增修改游戏名
              </li>
              <li>2.优化代码:使用了状态管理zustand</li>
              <li>3.修改样式:重构了顶部栏UI,使用了动画交互motion,提高了交互体验</li>
              <li>4.修复漏洞:修改了存在的错误和bug </li>
              <li>5.撰写批注:在关键地方添加注释,增加可读性</li>
            </ul>
          </div>
        </div>
        {/* 2025年8月22号 */}
        <div>
          <div className="flex flex-row">
            <FaClock className="mt-0.5 mr-5 text-2xl text-amber-500" />
            <p className="text-xl font-bold">2025年8月22号</p>
          </div>
          <div>
            <div className="flex flex-row">
              <FaCircleCheck className="mt-1 mr-5 text-2xl text-green-500" />
              <div className="mt-3.5 h-1 w-60 rounded-r-full bg-gradient-to-l from-green-200 via-green-400 to-green-600"></div>
            </div>
            <ul className="ml-15">
              <li>1.添加功能:在玩游戏的时候可以选择游戏模式，并且在不同的模式下有不同的休息时间提醒，并且支持热切换，还要准确记录每一个模式下的游戏时长，有休息期和宽裕期。</li>
              <li>2.修改样式:使用GSAP动画库,重构了部分UI</li>
              <li>3.测试:对新功能进行全面测试，确保其稳定性和可靠性</li>
            </ul>
          </div>
        </div>
        <div className="mt-20 text-xl">
          <Link to={'/'}>
            <button className="cursor-pointer">返回主页</button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Updata;
