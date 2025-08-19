import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { VscTriangleDown, VscComment } from 'react-icons/vsc';
import { motion, Variants } from 'framer-motion';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';

import logo from '../assets/lopgame.png';
import useInfoStore from '@renderer/store/infoStore';
import useGameStore from '@renderer/store/GameStore';
import { formatTime } from '@renderer/util/timeFormat';

const NavHeader = () => {
  //#region 状态管理
  // 用于控制动画指针的位置和旋转角度
  const [position, setPosition] = useState({ x: 0, y: 0, rotate: 0 });
  // 搜索输入框的值
  const [inputRef, setInputRef] = useState<string>('');
  // 用于标识鼠标是否处于抓取状态
  const [grab, setGrab] = useState<boolean>(false);
  // 存储全局信息状态
  const info = useInfoStore((state) => state.info);
  // 用于设置游戏列表
  const setGameList = useGameStore((state) => state.setGameList);
  // 游戏运行的时间
  const gameTime = useGameStore((state) => state.gameTime);
  // 游戏当前的运行状态（run stop null）
  const gameState = useGameStore((state) => state.gameState);
  // 开启信息显示(下方小框)
  const onInfo = useInfoStore((state) => state.onInfo);
  // 关闭信息显示(下方小框)
  const offInfo = useInfoStore((state) => state.offInfo);
  // 设置搜索结果
  const searchResults = useGameStore((state) => state.setSearchResults);
  // 控制 Logo 动画的激活状态
  const [active, setActive] = useState(false);
  // 开关模式选择器
  const setGameModeSelector = useGameStore((state) => state.setGameModeSelector);
  // 当前游戏模式
  const gameMode = useGameStore((state) => state.gameMode);
  //获取添加信息
  const setInfo = useInfoStore((state) => state.setInfo);
  //打字机效果
  const typewriterRef = useRef<HTMLParagraphElement>(null);

  //#endregion 状态管理

  //添加游戏
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

  //#region 动画配置

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
  gsap.registerPlugin(TextPlugin);
  //打字机效果
  useGSAP(() => {
    if (typewriterRef.current) {
      gsap.fromTo(
        typewriterRef.current,
        { text: '' },
        { text: '暂无游戏运行', duration: 1, ease: 'none' },
      );
    }
  });
  // 流动渐变文字动画
  useGSAP(() => {
    gsap.to('.GSAPanimate-modeText', {
      backgroundPosition: '200% center',
      duration: 3,
      ease: 'none',
      repeat: -1,
    });
  });
  //#endregion

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
  // 处理模糊查询
  const handleSearch = async (keyword: string) => {
    const gameList = await window.api.searchGames(keyword);
    searchResults(gameList);
  };
  //模式选择器动画
  const logoAnimate: Variants = {
    initial: { scale: 1, rotate: 0 },
    active: { scale: 1.2, rotate: 180, transition: { ease: ['easeOut'] } },
  };
  //游戏模式中文映射
  const gameModeMap: { [key: string]: string } = {
    Normal: '普通模式',
    Fast: '快速模式',
    Afk: '挂机模式',
    Test: '测试模式',
    Infinity: '沉浸模式',
  };

  return (
    <div className="items-centers flex justify-start border-b-1 border-black">
      <motion.img
        src={logo}
        alt="logo"
        className="z-10 mr-5 w-12 cursor-pointer rounded-2xl"
        variants={logoAnimate}
        initial="initial"
        animate={active ? 'active' : 'disabled'}
        onClick={() => {
          setActive(!active);
          setGameModeSelector();
        }}
        onMouseEnter={() => {
          setPosition({ x: -50, y: 20, rotate: 90 });
        }}
      />

      <div className="relative flex w-full flex-row">
        {/* 动画指针 */}
        <motion.div className="absolute bottom-9 left-8 z-50" animate={position}>
          <VscTriangleDown />
        </motion.div>
        {/* 添加游戏 */}
        <motion.button
          onClick={handleAddGame}
          className="flex-center cursor-pointer flex-row px-2 text-stone-900 hover:text-stone-600"
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
            to={'/dashboard'}
            className="flex-center cursor-pointer flex-row px-2 text-stone-900 hover:text-stone-600"
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
            className="flex-center cursor-pointer flex-row px-2 text-stone-900 hover:text-stone-600"
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
            className={`flex-center mt-2 ml-5 h-8 w-40 flex-col rounded-full border border-gray-300 bg-white shadow-sm`}
          >
            <input
              type="text"
              className={`w-25 text-gray-700 focus:outline-none`}
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleSearch(inputRef)}
            className="absolute top-3.5 right-1.5 cursor-pointer text-stone-900 hover:text-stone-600"
          >
            <FaSearch className="text-xl" />
          </button>
        </motion.div>

        {/* 状态通知 */}
        <motion.div
          className={`flex-row-v ml-5 text-center ${grab ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseEnter={() => setPosition({ x: 430, y: 20, rotate: -90 })}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          variants={divVariants}
          whileHover="hover"
          initial="initial"
        >
          <div className="flex-row-v relative text-center">
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
        <div className="flex-col-v absolute top-0 right-0 h-full border-l-2 border-dashed border-l-black">
          <div className="relative p-2">
            {gameState === 'run' ? (
              <>
                <p className="text-xs">{formatTime(gameTime) && '游戏运行中'}</p>
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
                <p ref={typewriterRef} className="text-xs">
                  暂无游戏运行
                </p>
                <p
                  style={{
                    backgroundSize: '200% 100%',
                    backgroundPosition: '0% center',
                  }}
                  className=" GSAPanimate-modeText bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"
                >
                  {gameModeMap[gameMode] || '...'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavHeader;
