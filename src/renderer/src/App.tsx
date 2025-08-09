import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game, Banners } from './types/Game';

import NavHeader from './components/NavHeader';
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

  // //加载主页数据
  // useEffect(() => {
  //   fetchGames();
  // }, [fetchGames]);  
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
