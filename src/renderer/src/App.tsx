import { useCallback, useEffect,useState } from 'react';
import { formatTime,formatTimeCalender } from './util/timeFormat';
import type { Game } from './types/Game';

function App(): React.JSX.Element {
  const [games, setGames] = useState<Game[]>([]);
  

  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  // 加载游戏列表
  const fetchGames = useCallback(async () => {
    const gameList = await window.api.getAllGames();
    
    setGames(gameList);
  }, []);

  // 组件加载时获取游戏列表和设置监听器
  useEffect(() => {
    fetchGames();    
    window.api.onTimerUpdate(setElapsedTime);
    window.api.onTimerStopped(() => {
      setMessage(`《${runningGame?.game_name}》已关闭。`);
      setRunningGame(null);
      fetchGames(); 
    });
  }, [fetchGames, runningGame]);
  //添加游戏
  const handleAddGame = async () => {
    const path = await window.api.openFile();
    if (!path) return;

    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏';
    
    try {
      await window.api.addGame({ gameName:defaultName, launchPath: path });
      setMessage(`✅ 游戏《${defaultName}》已成功添加！`);
      fetchGames(); // 刷新列表
    } catch (error: any) {
      setMessage(`❌ 添加失败: ${error.message}`);
    }
  };
  // 删除游戏
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
  // 运行游戏
  const handleRunGame = async (game: Game) => {
    if (runningGame) {
      setMessage('已有另一个游戏在运行中！');
      console.log(runningGame)
      return;
    }
    setMessage(`正在启动《${game.game_name}》...`);
    const result = await window.api.executeFile({ id: game.id, path: game.launch_path });
    console.log(result)
    if (result.success) {
      setRunningGame(game);
      setElapsedTime(0);
      setMessage(`《${game.game_name}》正在运行...`);
    } else {
      setMessage(`${result.message}`);
      setRunningGame(null);
    }
  };
  return (
    <>
      <button onClick={handleAddGame} >添加新游戏</button>      
      {/* 游戏列表 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={styles.th}>游戏名称</th>
            <th style={styles.th}>总游戏时长</th>
            <th style={styles.th}>启动次数</th>
            <th style={styles.th}>上次启动时间</th>
            <th style={styles.th}>创建时间</th>
            <th style={styles.th}>更新时间</th>
            <th style={styles.th}>操作</th>            
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <td style={styles.td}>{game.game_name}</td>
              <td style={styles.td}>{formatTime(game.total_play_time)}</td>
              <td style={styles.td}>{game.launch_count}</td>
              <td style={styles.td}>{game.last_launch_time?formatTimeCalender(game.last_launch_time):'暂无'}</td>
              <td style={styles.td}>{formatTimeCalender(game.created_at)}</td>
              <td style={styles.td}>{formatTimeCalender(game.updated_at)}</td>
              <td style={styles.td}>
                <button onClick={() => handleRunGame(game)} >运行</button>
                <button onClick={() => handleDeleteGame(game)}  style={{ marginLeft: '10px' }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {`消息通知 :${message}`}
      {elapsedTime?`运行时间 :${formatTime(elapsedTime)}`:<></>}
    </>
  );
  
}
const styles: { th: React.CSSProperties; td: React.CSSProperties } = {
  th: { border: '1px solid #ccc', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
  td: { border: '1px solid #ccc', padding: '8px' }
};
export default App;
