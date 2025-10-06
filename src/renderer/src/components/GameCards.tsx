import { Banners, Game } from '@renderer/types/Game';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VscFileMedia, VscFolder, VscPlay, VscTrash } from 'react-icons/vsc';
import { GiAchievement } from "react-icons/gi";
import useGameStore from '@renderer/store/GameStore';
import useInfoStore from '@renderer/store/infoStore';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import { formatTime, formatTimeCalender } from '@renderer/util/timeFormat';
import { motion, Variants } from 'motion/react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Selector from './GameModeSelector/Selector';
import { RestTimeContent } from './ModalContent/RestTimeContent';
import Portal from './Portal';
import { FaArrowUp, FaPersonWalkingArrowRight } from 'react-icons/fa6';
import { FaGithub } from "react-icons/fa";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const GameCards = () => {
  // #region 状态管理
  // 存储游戏列表数据
  const [games, setGames] = useState<Game[]>([]);
  // 存储游戏封面图的引用
  const BannersRef = useRef<Banners[]>(null);
  // 控制是否显示休息时间弹窗
  const [showRestTimeModal, setShowRestTimeModal] = useState(false);
  // 获取当前游戏的全局状态ID
  const getGameList = useGameStore((state) => state.gameId);
  // 设置全局提示信息
  const setInfo = useInfoStore((state) => state.setInfo);
  // 更新游戏的计时信息
  const setGameTime = useGameStore((state) => state.setGameTime);
  // 获取当前游戏的运行状态
  const GameState = useGameStore((state) => state.gameState);
  // 设置当前游戏的运行状态
  const setGameState = useGameStore((state) => state.setGameState);
  // 存储搜索结果
  const searchResults = useGameStore((state) => state.searchResults);
  // 获取当前选择的游戏模式
  const gameMode = useGameStore((state) => state.gameMode);
  //游戏状态
  const gameState = useGameStore((state) => state.gameState);
  // 当前选择的分类 - 从全局状态获取
  const selectedCategory = useGameStore((state) => state.selectedCategory);
  const setSelectedCategory = useGameStore((state) => state.setSelectedCategory);
  // 分类菜单展开状态
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  // 控制分类菜单是否渲染在 DOM 中
  const [shouldRenderCategories, setShouldRenderCategories] = useState(false);
  // 分类按钮的引用
  const categoryBtnRef = useRef<HTMLButtonElement>(null);
  const categoryItemsRef = useRef<HTMLButtonElement[]>([]);
  // #endregion

  useEffect(() => {
    fetchGamesByCategory(); // 改为使用分类查询,这样会读取持久化的 selectedCategory
    //当游戏全局状态ID改变时触发
  }, [getGameList]);
  
  // 当分类改变时重新获取游戏列表
  useEffect(() => {
    fetchGamesByCategory();
  }, [selectedCategory]);

  // 根据分类获取游戏数据
  const fetchGamesByCategory = useCallback(async () => {
    BannersRef.current = await window.api.getBanners();
    if (selectedCategory === 'all') {
      const gameList = await window.api.getAllGames();
      setGames(gameList);
    } else {
      const gameList = await window.api.getGamesByCategory(selectedCategory);
      setGames(gameList);
    }
  }, [selectedCategory]);

  // 缓存停止计时函数
  const handleTimerStopped = useCallback(() => {
    setInfo(`游戏已关闭。`);
    setGameState('stop');
    fetchGamesByCategory();
  }, [fetchGamesByCategory]);
  //加载主页数据 --
  useEffect(() => {
    fetchGamesByCategory(); // 改为使用分类查询
    //放置打开休息界面监听器
    window.api.onOpenRestTimeModal(() => {
      setShowRestTimeModal(true);
    });
    //退出主页时移除监听器
    return () => {
      window.api.offOpenRestTimeModal();
    };
  }, [fetchGamesByCategory]);
  //重载模糊查询数据 --
  useEffect(() => {
    if (searchResults.length > 0) {
      setGames(searchResults);
    }
  }, [searchResults]);
  //打开游戏文件夹 --
  const handleOpenGameFolder = async (folderPath: string) => {
    await window.api.openFolder(folderPath);
  };
  //启动游戏 --
  const handleRunGame = async (game: Game) => {
    //注册监听器
    window.api.onTimerUpdate(setGameTime);
    window.api.onTimerStopped(handleTimerStopped);
    if (GameState === 'run') {
      setInfo(`已经有另一个游戏在运行中`);
      return;
    }

    const result = await window.api.executeFile({
      id: game.id,
      path: game.launch_path,
      gameMode: gameMode,
    });

    if (result.success) {
      setGameState('run');
      setInfo(`启动!!! ${game.game_name}`);
    } else {
      setGameState('null');
    }
  };
  //删除游戏 --
  const handleDeleteGame = async (game: Game) => {
    if (GameState === 'run') {
      setInfo(`不能删除正在运行的游戏！`);
      return;
    }
    if (
      confirm(`确定要删除游戏《${game.game_name}》?\n此操作只会删除游戏的记录 ,不会删除游戏本地的文件。
      `)
    ) {
      await window.api.deleteGame(game.id);
      setInfo(`游戏${game.game_name}已删除。`);
      fetchGamesByCategory();
    }
  };
  //添加封面 --
  const handleAddBanner = async (game: Game) => {
    const targetPath = 'banner/';
    const path = await window.api.openFile();
    //获取旧的封面地址便于删除和替换
    let oldFilePath = BannersRef.current?.find((i) => i.game_id === game.id)
      ?.relative_path as string;
    if (!path) return;
    //首次默认为封面，所以跳过
    if (oldFilePath == undefined) oldFilePath = 'skip';
    try {
      //先复制一份到资源目录下
      const result = await window.api.copyImages({
        origin: path,
        target: targetPath,
        gameName: game.game_name,
        oldFilePath: oldFilePath,
      });
      //再添加封面
      await window.api.addBanner({
        gameId: game.id,
        imagePath: path,
        relativePath: result.relativePath,
      });
      setInfo(`${game.game_name}添加新封面图!`);
      fetchGamesByCategory();
    } catch (error: any) {
      setInfo(`添加封面失败`);
    }
  };
  //动画效果父 --
  const gameList: Variants = {
    initial: {},
    hover: {
      transition: {
        // 每个子元素动画依次延迟 0.1 秒
        staggerChildren: 0.1,
      },
    },
  };
  //动画效果子 --
  const gameItems: Variants = {
    initial: { x: 100, opacity: 0 },
    hover: { x: 0, opacity: 1 },
  };
  //进入休息状态
  const enterRestMode = () => {
    window.api.setResting(true);
  };

  // GSAP 动画控制
  useGSAP(() => {
    if (isCategoryOpen) {
      // 展开动画 - 依次弹出
      setShouldRenderCategories(true);
      gsap.fromTo(
        categoryItemsRef.current,
        {
          opacity: 0,
          y: -20,
          scale: 0.8,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.3,
          stagger: 0.1, // 每个按钮延迟 0.1 秒
          ease: 'back.out(1.7)',
        }
      );
    } else if (shouldRenderCategories) {
      // 收起动画 - 依次收起
      gsap.to(categoryItemsRef.current, {
        opacity: 0,
        y: -20,
        scale: 0.8,
        duration: 0.2,
        stagger: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          // 动画完成后再从 DOM 中移除
          setShouldRenderCategories(false);
        },
      });
    }
  }, [isCategoryOpen, shouldRenderCategories]);

  // 切换分类菜单展开状态
  const toggleCategory = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };

  // 处理分类选择
  const handleCategoryChange = (category: 'all' | 'playing' | 'archived') => {
    setSelectedCategory(category);
  };

  return (
    <>
      <div className="relative flex min-h-dvh flex-col bg-[url(../assets/background.jpg)] bg-cover bg-fixed">
        {/* 游戏模式选择器 */}
        {/* 简易遮罩 */}
        <div className="fixed top-1/2 left-0 w-40 -translate-y-1/2">
          <Selector />
        </div>
        {/* 主动休息按钮 */}
         {gameState === 'run' && (         
          <motion.div>
            <div className="fixed top-17 right-0 z-30 rounded-l-2xl border border-gray-300 bg-white px-2 py-2 shadow-md">
              <button
                onClick={() => enterRestMode()}
                className="flex cursor-pointer flex-row items-center"
              >
                <FaPersonWalkingArrowRight className="text-3xl text-gray-700" />
                <p className="ml-2">休息</p>
              </button>
            </div>
          </motion.div>
        )}
        {/* GitHub 按钮 */}
        <motion.div>
          <div className="fixed left-4 bottom-8 z-50 rounded-2xl border border-gray-300/50 bg-white px-2 py-2 shadow-md">
            <button
              onClick={() => window.open('https://github.com/345jr/LopGameBox', '_blank')}
              className="flex cursor-pointer flex-row items-center"
            >
              <FaGithub className="text-xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* 回到顶部按钮 */}
        <motion.div>
          <div className="fixed right-4 bottom-8 z-50 rounded-2xl border border-gray-300/50 bg-white px-2 py-2 shadow-md">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex cursor-pointer flex-row items-center"
            >
              <FaArrowUp className="text-3xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* 游戏分类区域 */}
        <div className="fixed right-4 top-32 z-50">
          {/* 主按钮 - 显示分类 */}
          <button
            ref={categoryBtnRef}
            onClick={toggleCategory}
            className="mb-2 w-full rounded-md bg-white px-4 py-2 text-sm shadow-md transition-all hover:bg-blue-200 border-gray-500 border-2"
          >
            {/* {isCategoryOpen ? '收起分类' : '显示分类'} */}
            游戏分类
          </button>
          {/* 分类选项容器 */}
          {shouldRenderCategories && (
            <div className="flex flex-col gap-2">
              <button
                ref={(el) => {
                  if (el) categoryItemsRef.current[0] = el;
                }}
                onClick={() => handleCategoryChange('playing')}
                className={`relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
                  selectedCategory === 'playing' 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : 'bg-white hover:bg-blue-200'
                }`}
                style={{ opacity: 0 }}
              >
                攻略中
              </button>
              <button
                ref={(el) => {
                  if (el) categoryItemsRef.current[1] = el;
                }}
                onClick={() => handleCategoryChange('archived')}
                className={`relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
                  selectedCategory === 'archived' 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : 'bg-white hover:bg-blue-200'
                }`}
                style={{ opacity: 0 }}
              >
                已归档
              </button>
              <button
                ref={(el) => {
                  if (el) categoryItemsRef.current[2] = el;
                }}
                onClick={() => handleCategoryChange('all')}
                className={`relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : 'bg-white hover:bg-blue-200'
                }`}
                style={{ opacity: 0 }}
              >
                全部
              </button>
            </div>
          )}
        </div>
        {/* 休息模态框 */}
        {showRestTimeModal &&
          createPortal(
            <RestTimeContent onClose={() => setShowRestTimeModal(false)} />,
            document.body,
          )}
        {/*  暂用-休息调试 */}
        {/* <button onClick={() => setShowRestTimeModal(true)} className="text-white">
          休息时间调试
        </button> */}
        {/* 游戏卡片 */}
        {games.map((game) => (
          <div key={game.id} className="flex-center flex-col p-4">
            <div className="flex flex-row">
              <motion.div
                whileHover="hover"
                initial="initial"
                variants={gameList}
                className="group relative ml-60 h-70 w-120"
              >
                {/* 封面图   */}
                <motion.img
                  src={
                    'lop://' +
                    BannersRef.current
                      ?.find((i: Banners) => i.game_id === game.id)
                      ?.relative_path?.replace(/\\/g, '/')
                  }
                  alt="banner图"
                  className="h-70 w-120 rounded-2xl border-2 border-white bg-cover bg-center"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.8 } }}
                />
                {/* 圆形遮罩层 */}
                <motion.div
                  variants={gameItems}
                  className="pointer-events-none absolute top-0 right-0 h-70 w-64 rounded-l-[20px] rounded-r-2xl bg-stone-600/75 p-5"
                />
                <motion.div
                  variants={gameItems}
                  className="pointer-events-none absolute top-0 right-0 h-70 w-62 rounded-l-[20px] rounded-r-2xl bg-stone-700/75 p-5"
                />
                <motion.div
                  variants={gameItems}
                  className="absolute top-0 right-0 z-20 h-70 w-60 rounded-l-[20px] rounded-r-2xl border-r-2 border-white bg-stone-800/75 p-5"
                >
                    <div className="flex flex-row p-0.5  justify-between">
                    <p className="text-white whitespace-nowrap">游戏名称:</p>
                      <p
                        className={`text-white ${
                          game.game_name.length > 7 ? 'text-xs' : 'text-base'
                        }   max-w-[140px]`}
                        title={game.game_name}
                      >
                        {game.game_name}
                      </p>
                    </div> 

                    <div className="flex flex-row p-0.5 justify-between">
                    <p className="text-white">游戏时长:</p>
                    <p className="text-white">{formatTime(game.total_play_time)}</p>
                    </div>

                    <div className="flex flex-row p-0.5 whitespace-nowrap justify-between">
                    <p className="text-white">上次启动:</p>
                    <p className="text-white text-xs">
                      {game.last_launch_time ? formatTimeCalender(game.last_launch_time) : '暂无'}
                    </p>
                    </div>

                    <div className="flex flex-row p-0.5 whitespace-nowrap justify-between">
                    <p className="text-white">添加时间:</p>
                    <p className="text-white text-xs">{formatTimeCalender(game.created_at)}</p>
                    </div>

                    <div className="flex flex-row p-0.5 justify-between">
                    <p className="text-white">启动次数:</p>
                    <p className="text-white">{game.launch_count}</p>
                    </div>

                    <div className="flex flex-row mb-4 p-0.5 justify-between">
                    <p className="text-white">空间占用大小:</p>
                    <p className="text-white">{gameSizeFormat(game.disk_size)}</p>
                    </div>
                  <div className="m-4 h-0.5 w-40 bg-white"></div>

                  {/* 操作区 */}
                  {/* 启动游戏 */}
                  <div className="grid grid-cols-6 grid-rows-2 gap-1">
                    <motion.button
                      onClick={() => handleRunGame(game)}
                      initial={{ y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      <VscPlay className="iconBtn" />
                    </motion.button>
                    {/* 打开游戏文件夹 */}
                    <motion.button
                      initial={{ y: 0 }}
                      whileHover={{ y: -5 }}
                      onClick={() => handleOpenGameFolder(game.launch_path)}
                    >
                      <VscFolder className="iconBtn" />
                    </motion.button>
                    {/* 打开配置页面 */}
                    <Portal gameId={game.id} updata={setGames} />
                    {/* 封面图修改 */}
                    <motion.button
                      onClick={() => handleAddBanner(game)}
                      initial={{ y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      <VscFileMedia className="iconBtn" />
                    </motion.button>
                    {/* 游戏图集与成就面板 */}
                    <motion.button initial={{ y: 0 }} whileHover={{ y: -5 }}>
                      <Link to={`/gallery/${game.id}`}>
                        <GiAchievement className="iconBtn" />
                      </Link>
                    </motion.button>                    
                    {/* 删除游戏记录 */}
                    <motion.button
                      onClick={() => handleDeleteGame(game)}
                      initial={{ y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      <VscTrash className="iconBtn" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
              {/* 一个阻挡的块，防止触发隐藏的动画元素 */}
              <div className="z-30 h-70 w-30 bg-amber-300 opacity-0"></div>
            </div>
          </div>
        ))}
        {/* 底部模糊层 */}
        <div className="fixed top-9/10 right-0 bottom-0 left-0 z-10 bg-gradient-to-b from-transparent to-gray-600/95"></div>
      </div>
    </>
  );
};

export default GameCards;
