import { Banners, Game } from '@renderer/types/Game';
import { useCallback, useEffect, useRef, useState } from 'react';
import GameCardActions from './Action';
import GameCardData from './CardData';
import useGameStore from '@renderer/store/GameStore';
import { motion, Variants } from 'motion/react';
import { createPortal } from 'react-dom';
import Selector from '../GameModeSelector/Selector';
import { RestTimeContent } from '../ModalContent/RestTimeContent';
import LinksContent from '../ModalContent/LinksContent';
import FolderManageContent from '../ModalContent/FolderManageContent';
import { FaArrowUp, FaPersonWalkingArrowRight } from 'react-icons/fa6';
import { FaGithub, FaList } from "react-icons/fa";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'react-hot-toast';
import { VscAdd } from "react-icons/vsc";

import EmptyBox from "@renderer/assets/emptyBox.png";

const GameCards = () => {
  // #region 状态管理
  // 存储游戏列表数据
  const [games, setGames] = useState<Game[]>([]);
  // 存储游戏封面图的引用
  const BannersRef = useRef<Banners[]>(null);
  // 控制是否显示休息时间弹窗
  const [showRestTimeModal, setShowRestTimeModal] = useState(false);
  // 控制是否显示外链管理弹窗
  const [showLinksModal, setShowLinksModal] = useState(false);
  // 控制是否显示文件管理弹窗
  const [showFolderModal, setShowFolderModal] = useState(false);
  // 当前选择的游戏ID(用于外链管理)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  // 当前选择的游戏路径(用于文件管理)
  const [selectedGamePath, setSelectedGamePath] = useState<string>('');
  // 获取当前游戏的全局状态ID
  const getGameList = useGameStore((state) => state.gameId);
  // 存储搜索结果
  const searchResults = useGameStore((state) => state.searchResults);  
  //游戏状态
  const gameState = useGameStore((state) => state.gameState);
  // 当前选择的分类 - 从全局状态获取
  const selectedCategory = useGameStore((state) => state.selectedCategory);
  const setSelectedCategory = useGameStore((state) => state.setSelectedCategory);
  // 用于刷新游戏列表
  const setGameList = useGameStore((state) => state.setGameList);
  // 分类菜单展开状态
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  // 控制分类菜单是否渲染在 DOM 中
  const [shouldRenderCategories, setShouldRenderCategories] = useState(false);
  // 分类按钮的引用
  const categoryBtnRef = useRef<HTMLButtonElement>(null);
  const categoryItemsRef = useRef<HTMLButtonElement[]>([]);
  // #endregion

  // 当分类改变时重新获取游戏列表,添加新游戏时也会触发
  useEffect(() => {
    fetchGamesByCategory();
  }, [getGameList, selectedCategory]);

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

  //加载主页数据 --
  useEffect(() => {
    fetchGamesByCategory(); 
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
  // 打开文件管理模态框 -- 由 Action 触发
  const handleOpenFolderModal = (folderPath: string, gameId: number) => {
    setSelectedGamePath(folderPath);
    setSelectedGameId(gameId);
    setShowFolderModal(true);
  };
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
      toast.success(`${defaultName} 已添加`);
      //添加游戏后刷新游戏列表
      setGameList(gameInitData.id);
    } catch (error: any) {
      console.log(`${error.message}`);
      toast.error(`添加游戏失败: ${error.message}`);
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
        {/* 空列表提示 */}
        {games.length === 0 && (
          <div className="flex-center mt-32 flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-white/60 p-4 shadow-md">
              <img src={EmptyBox} alt="empty" className="h-32 w-32 object-contain" />
            </div>
            <p className="text-white text-2xl mt-5">仓库为空 , 快去添加游戏吧！</p>
          </div>
        )}
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
          {/* 添加游戏按钮 */}
          <motion.button
            onClick={handleAddGame}
            className="cursor-pointer mb-2 w-full rounded-md bg-white px-4 py-2 text-sm shadow-md transition-all hover:bg-blue-200 border-gray-500 border-2 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <VscAdd className="text-lg" />
            <span>添加游戏</span>
          </motion.button>
          {/* 主按钮 - 显示分类 */}
          <motion.button
            ref={categoryBtnRef}
            onClick={toggleCategory}
            className="cursor-pointer mb-2 w-full rounded-md bg-white px-4 py-2 text-sm shadow-md transition-all hover:bg-blue-200 border-gray-500 border-2 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.03 }}
          >
            <FaList className="text-lg" />
            <span>游戏分类</span>
          </motion.button>
          {/* 分类选项容器 */}
          {shouldRenderCategories && (
            <div className="flex flex-col gap-2">
              <button
                ref={(el) => {
                  if (el) categoryItemsRef.current[0] = el;
                }}
                onClick={() => handleCategoryChange('playing')}
                className={`cursor-pointer relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
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
                className={`cursor-pointer relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
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
                className={`cursor-pointer relative overflow-hidden rounded-md px-4 py-2 text-sm shadow-md transition-colors border-gray-500 border-2 ${
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
        {/* 外链管理模态框 */}
        {showLinksModal && selectedGameId &&
          createPortal(
            <LinksContent 
              gameId={selectedGameId}
              onClose={() => {
                setShowLinksModal(false);
                setSelectedGameId(null);
              }} 
            />,
            document.body,
          )}
        {/* 文件管理模态框 */}
        {showFolderModal && selectedGameId &&
          createPortal(
            <FolderManageContent 
              gamePath={selectedGamePath}
              gameId={selectedGameId}
              onClose={() => {
                setShowFolderModal(false);
                setSelectedGamePath('');
              }} 
            />,
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
                  {/*数据区*/}
                  <GameCardData game={game} />
                  {/*操作区*/}
                    <GameCardActions
                      game={game}
                      onOpenLinks={(id) => {
                        setSelectedGameId(id);
                        setShowLinksModal(true);
                      }}
                      onOpenFolderModal={handleOpenFolderModal}
                      onUpdateGames={setGames}
                    />
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
