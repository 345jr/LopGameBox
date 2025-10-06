import { useGSAP } from '@gsap/react';
import { motion, Variants } from 'framer-motion';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose, VscTriangleDown } from 'react-icons/vsc';
import { Link } from 'react-router-dom';

import useGameStore from '@renderer/store/GameStore';
import useInfoStore from '@renderer/store/infoStore';
import { formatTime } from '@renderer/util/timeFormat';
import logo from '../assets/lopgame.png';

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
  // 窗口是否最大化状态
  const [isMaximized, setIsMaximized] = useState(false);

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
  const flipperRef = useRef<HTMLDivElement>(null);
  // 文字翻转效果
  useGSAP(
    () => {
      if (!flipperRef.current) return;
      const tl = gsap.timeline({ repeat: -1 });
      // 背面停留10秒,正面停留10秒
      tl.to(flipperRef.current, { rotationY: 180, duration: 1 })
        .to(flipperRef.current, {}, '+=10')
        .to(flipperRef.current, { rotationY: 0, duration: 1 })
        .to(flipperRef.current, {}, '+=10');
      return () => tl.kill();
    },
    { scope: flipperRef, dependencies: [gameState] },
  );
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
  
  // 窗口控制函数
  const handleMinimize = () => {
    window.api.minimizeWindow();
  };

  const handleMaximize = async () => {
    await window.api.maximizeWindow();
    const maximized = await window.api.isWindowMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.api.closeWindow();
  };

  // 初始化窗口最大化状态
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.api.isWindowMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  //模式选择器动画
  const logoAnimate: Variants = {
    initial: { rotate: 0 },
    active: { rotate: 90, transition: { ease: ['easeOut'] } },
  };
  //游戏模式名中文映射
  const gameModeMap: { [key: string]: string } = {
    Normal: '普通模式',
    Fast: '快速模式',
    Afk: '挂机模式',
    Test: '测试模式',
    Infinity: '沉浸模式',
  };
  // 游戏模式颜色映射
  const gameModeColorMap: { [key: string]: string } = {
    Normal: 'from-lime-500 via-green-500 to-emerald-500',
    Fast: 'from-orange-500 via-amber-500 to-yellow-400',
    Afk: 'from-blue-500 via-cyan-500 to-sky-400',
    Test: 'from-purple-500 via-violet-500 to-fuchsia-500',
    Infinity: 'from-rose-500 via-pink-500 to-purple-500',
  };

  return (
    <div className="relative border-b-1 border-black" style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto 1fr auto auto' }}>
      {/* Logo 图标 - 固定宽度 */}
      <motion.div 
        className="flex items-center justify-center px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <motion.img
          src={logo}
          alt="logo"
          className="w-12 cursor-pointer rounded-2xl"
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
      </motion.div>

      {/* 添加游戏按钮 - 固定宽度 */}
      <motion.div 
        className="flex items-center justify-center relative"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <motion.div className="absolute bottom-9 left-8 z-50" animate={position}>
          <VscTriangleDown />
        </motion.div>
        <motion.button
          onClick={handleAddGame}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          whileHover={{ scale: 1.1 }}
          onMouseMove={() => {
            setPosition({ x: 10, y: 0, rotate: 0 });
          }}
        >
          添加游戏
        </motion.button>
      </motion.div>

      {/* 统计面板 - 固定宽度 */}
      <motion.div 
        className="flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Link
          to={'/dashboard'}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          onMouseMove={() => {
            setPosition({ x: 105, y: 0, rotate: 0 });
          }}
        >
          统计面板
        </Link>
      </motion.div>

      {/* 设置中心 - 固定宽度 */}
      <motion.div 
        className="flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Link
          to={'/setting'}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          onMouseMove={() => {
            setPosition({ x: 200, y: 0, rotate: 0 });
          }}
        >
          设置中心
        </Link>
      </motion.div>

      {/* 搜索区域 - 固定宽度 */}
      <motion.div
        className="flex items-center justify-center relative px-3"
        onMouseEnter={() => {
          setPosition({ x: 250, y: 16, rotate: -90 });
        }}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center h-8 w-40 rounded-full border border-gray-300 bg-white shadow-sm">
          <input
            type="text"
            className="w-25 text-gray-700 focus:outline-none bg-transparent"
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleSearch(inputRef)}
          className="absolute right-5 cursor-pointer text-stone-900 hover:text-stone-600"
        >
          <FaSearch className="text-xl" />
        </button>
      </motion.div>

      {/* 可拖拽区域 - 自适应宽度 (1fr) */}
      <div 
        className="flex items-center justify-center min-w-0 p-1"
      >
        <div className='grow border-2 border-dashed rounded-lg  border-gray-400 p-3' 
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <p className="h-full text-xs text-gray-400 select-none whitespace-nowrap text-center">
            拖拽区域
          </p>
        </div>
      </div>

      {/* 游戏运行状态 - 固定宽度 */}
      <div 
        className="flex items-center justify-center border-l-2 border-dashed border-l-black px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="relative py-2">
          {gameState === 'run' ? (
            <>
              {/* 文字翻转效果 */}
              <div ref={flipperRef} className="relative transform-3d">
                {/* 文字正面 */}
                <p className="absolute text-xs backface-hidden whitespace-nowrap">
                  {formatTime(gameTime) && '游戏运行中'}
                </p>
                {/* 文字背面 */}
                <p
                  className={`absolute left-3 rotate-y-180 bg-gradient-to-bl text-sm whitespace-nowrap backface-hidden ${
                    gameModeColorMap[gameMode]
                  } bg-clip-text text-transparent`}
                >
                  {gameModeMap[gameMode] || '...'}
                </p>
              </div>
              <p className="mt-3.5 whitespace-nowrap">{formatTime(gameTime) || '...'}</p>
              {/* 绿色闪烁灯 */}
              <span className="absolute top-1.5 right-1.5 inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </>
          ) : gameState === 'stop' ? (
            <>
              <p className="text-xs whitespace-nowrap">{formatTime(gameTime) && '运行时间'}</p>
              <p className="whitespace-nowrap">
                {formatTime(gameTime) || '...'}
                <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </p>
            </>
          ) : (
            <>
              <p ref={typewriterRef} className="text-xs whitespace-nowrap">
                暂无游戏运行
              </p>
              <p
                style={{
                  backgroundSize: '200% 100%',
                  backgroundPosition: '0% center',
                }}
                className={`GSAPanimate-modeText bg-gradient-to-bl whitespace-nowrap ${
                  gameModeColorMap[gameMode]
                } bg-clip-text text-transparent`}
              >
                {gameModeMap[gameMode] || '...'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 窗口控制按钮区域 - 固定宽度 */}
      <div 
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
          aria-label="最小化"
        >
          <VscChromeMinimize className="text-lg" />
        </button>
        {/* 最大化/还原按钮 */}
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
          aria-label={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <VscChromeRestore className="text-lg" />
          ) : (
            <VscChromeMaximize className="text-lg" />
          )}
        </button>
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 hover:text-white transition-colors duration-200 flex items-center justify-center"
          aria-label="关闭"
        >
          <VscChromeClose className="text-lg" />
        </button>
      </div>
    </div>
  );
};export default NavHeader;
