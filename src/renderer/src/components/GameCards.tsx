import { Banners, Game } from '@renderer/types/Game';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  VscFolder,
  VscPlay,
  VscTrash,
  VscFileMedia,
  VscVm,
} from 'react-icons/vsc';

import { formatTime, formatTimeCalender } from '@renderer/util/timeFormat';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import Portal from './Portal';
import { Link } from 'react-router-dom';
import { motion,Variants } from 'motion/react';

const GameCards = () => {
  const [games, setGames] = useState<Game[]>([]);
  const BannersRef = useRef<Banners[]>(null);
  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  // 获取主页数据 --
  const fetchGames = useCallback(async () => {
    //获取游戏数据+获取游戏封面图
    const gameList = await window.api.getAllGames();
    BannersRef.current = await window.api.getBanners();
    setGames(gameList);
  }, []);
  // 缓存停止计时函数 --
  const handleTimerStopped = useCallback(() => {
    setMessage(`《${runningGame?.game_name}》已关闭。`);
    setRunningGame(null);
    fetchGames();
  }, [runningGame, setMessage, setRunningGame, fetchGames]);
  //加载主页数据 --
  useEffect(() => {
    console.log(`loading gameList success!`);
    fetchGames();
  }, [fetchGames]);

  //打开游戏文件夹 --
  const handleOpenGameFolder = async (folderPath: string) => {
    await window.api.openFolder(folderPath);
  };
  //启动游戏 --
  const handleRunGame = async (game: Game) => {
    //注册监听器
    window.api.onTimerUpdate(setElapsedTime);
    window.api.onTimerStopped(handleTimerStopped);
    if (runningGame) {
      setMessage('已有另一个游戏在运行中！');
      console.log(runningGame);
      return;
    }
    setMessage(`正在启动《${game.game_name}》...`);
    const result = await window.api.executeFile({
      id: game.id,
      path: game.launch_path,
    });

    if (result.success) {
      setRunningGame(game);
      setElapsedTime(0);
      setMessage(`《${game.game_name}》正在运行...`);
    } else {
      setMessage(`${result.message}`);
      setRunningGame(null);
    }
  };
  //删除游戏 --
  const handleDeleteGame = async (game: Game) => {
    if (runningGame?.id === game.id) {
      setMessage('不能删除正在运行的游戏！');
      return;
    }
    if (confirm(`确定要删除游戏《${game.game_name}》吗？此操作不可撤销。`)) {
      await window.api.deleteGame(game.id);
      setMessage(`游戏《${game.game_name}》已删除。`);
      fetchGames(); // 刷新列表
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
      setMessage(`✅ 游戏${game.game_name}已成功添加封面图！`);
      fetchGames();
    } catch (error: any) {
      setMessage(`❌ 添加失败: ${error.message}`);
    }
  };
  //动画效果父 --
  const gameList:Variants = {
    initial: {},
    hover: {
      transition: {
        // 每个子元素动画依次延迟 0.1 秒
        staggerChildren: 0.1, 
      },
    },
  };
  //动画效果子 --
  const gameItems:Variants = {
    initial:{x:100,opacity:0},
    hover:{x:0,opacity:1}
  }
  return (
    <>
      <div className="bg-[url(../assets/background.jpg)] bg-cover bg-center">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex flex-col items-center justify-center p-4 "
          >
            <div className='flex flex-row'>
              <motion.div
                whileHover="hover"
                initial="initial"              
                variants={gameList}
                className="group relative h-70 w-120 ml-60"
              >
                {/* 封面图   */}
                <img
                  src={
                    'lop://' +
                    BannersRef.current
                      ?.find((i: Banners) => i.game_id === game.id)
                      ?.relative_path?.replace(/\\/g, '/')
                  }
                  alt="banner图"
                  className="h-70 w-120 rounded-2xl border-2 border-white bg-cover bg-center"
                />                            
                {/* 圆形遮罩层 */}
                <motion.div
                  variants={gameItems}
                  className="absolute top-0 right-0 h-70 w-64 rounded-l-[20px] rounded-r-2xl bg-stone-600/75 p-5 pointer-events-none"
                />
                <motion.div
                  variants={gameItems}
                  className="absolute top-0 right-0 h-70 w-62 rounded-l-[20px] rounded-r-2xl bg-stone-700/75 p-5 pointer-events-none"
                />
                <motion.div
                  variants={gameItems}
                  className="absolute top-0 right-0 h-70 w-60 rounded-l-[20px] rounded-r-2xl border-r-2 border-white bg-stone-800/75 p-5 "
                >
                  <p className="p-0.5 text-white">游戏名:{game.game_name}</p>
                  <p className="p-0.5 text-white">
                    游戏时间:{formatTime(game.total_play_time)}
                  </p>
                  <p className="p-0.5 whitespace-nowrap text-white">
                    上次启动:
                    {game.last_launch_time
                      ? formatTimeCalender(game.last_launch_time)
                      : '暂无'}
                  </p>
                  <p className="p-0.5 whitespace-nowrap text-white">
                    添加时间:{formatTimeCalender(game.created_at)}
                  </p>
                  <p className="p-0.5 text-white">启动次数:{game.launch_count}</p>
                  <p className="mb-4 p-0.5 text-white">
                    空间占用大小:{gameSizeFormat(game.disk_size)}
                  </p>
                  <div className="m-4 h-0.5 w-40 bg-white"></div>
              
                  {/* 操作区 */}
                  {/* 启动游戏 */}
                  <div className="grid grid-cols-6 gap-1">
                    <button onClick={() => handleRunGame(game)}>
                      <VscPlay className="cursor-pointer text-2xl text-white" />
                    </button>
                    {/* 打开游戏文件夹 */}
                    <button
                      onClick={() => handleOpenGameFolder(game.launch_path)}
                    >
                      <VscFolder className="cursor-pointer text-2xl text-white" />
                    </button>
                    {/* 修改游戏名 */}
                    <Portal gameId={game.id} updata={setGames} />
                    {/* 删除游戏记录 */}
                    <button onClick={() => handleDeleteGame(game)}>
                      <VscTrash className="cursor-pointer text-2xl text-white" />
                    </button>
                    {/* 封面图修改 */}
                    <button onClick={() => handleAddBanner(game)}>
                      <VscVm className="cursor-pointer text-2xl text-white" />
                    </button>
                    {/* 游戏图集 */}
                    <button>
                      <Link to={`/gallery/${game.id}`}>
                        <VscFileMedia className="cursor-pointer text-2xl text-white" />
                      </Link>
                    </button>
                  </div>
                </motion.div>
                
              </motion.div>
              {/* 一个阻挡的块，防止触发隐藏的动画元素 */}
              <div className='opacity-0 h-70 w-60 z-50 bg-amber-300 pointer-events-none'></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default GameCards;
