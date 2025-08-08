import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, formatTimeCalender } from './util/timeFormat';
import gameSizeFormat from './util/gameSizeFormat';
import type { Game, Banners } from './types/Game';
import { Link } from 'react-router-dom';
import { VscFolder } from "react-icons/vsc";

import NavHeader from './components/NavHeader';
import Portal from './components/Portal';
import GameCards from './components/GameCards';
function App(): React.JSX.Element {
  const [games, setGames] = useState<Game[]>([]);
  const BannersRef = useRef<Banners[]>(null);
  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  // 加载主页数据
  const fetchGames = useCallback(async () => {
    //获取游戏数据
    const gameList = await window.api.getAllGames();
    //获取游戏封面图
    BannersRef.current = await window.api.getBanners();
    setGames(gameList);
  }, []);

  // 缓存停止计时函数
  const handleTimerStopped = useCallback(()=>{
    setMessage(`《${runningGame?.game_name}》已关闭。`);
    setRunningGame(null);
    fetchGames();
  },[runningGame, setMessage, setRunningGame, fetchGames])  
    
  useEffect(()=>{
    console.log(`loading gameList success!`)    
    fetchGames();
  },[fetchGames])

  

  //添加游戏
  const handleAddGame = async () => {
    const path = await window.api.openFile();
    if (!path) return;

    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏';

    try {
      await window.api.addGame({ gameName: defaultName, launchPath: path });
      setMessage(`✅ 游戏《${defaultName}》已成功添加！`);
      fetchGames(); // 刷新列表
    } catch (error: any) {
      setMessage(`❌ 添加失败: ${error.message}`);
    }
  };
  
  // 运行游戏
  const handleRunGame = async (game: Game) => {
    //注册监听器
    window.api.onTimerUpdate(setElapsedTime);
    window.api.onTimerStopped(handleTimerStopped)
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
  //添加封面
  const handleAddBanner = async (game: Game) => {
    const targetPath = 'banner/';
    const path = await window.api.openFile();
    //获取旧的封面地址便于删除和替换
    let oldFilePath = (BannersRef.current?.find(i=>i.game_id===game.id))?.relative_path as string
    if (!path) return;
    //首次默认为封面，所以跳过
    if (oldFilePath == undefined) oldFilePath = 'skip'
    try {
      //先复制一份到资源目录下
      const result = await window.api.copyImages({
        origin: path,
        target: targetPath,
        gameName: game.game_name,
        oldFilePath:oldFilePath
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
  
  

  return (
    <>
      <NavHeader AddGame={handleAddGame}/>
      <div className='w-full'>
        <GameCards/>
      </div>
      
    </>
  );
}
export default App;
