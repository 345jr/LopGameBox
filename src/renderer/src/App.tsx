import { useCallback, useEffect, useState } from 'react';
import type { Game } from './types/Game';

function formatTime(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0;
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function App(): React.JSX.Element {
  const [games, setGames] = useState<Game[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>('');


  // const dianji = async () => {
  //   const path = await window.api.openFile();
  //   setFilePath(path);
  // };
  //运行程序
  // const runFile = async (): Promise<void> => {
  //   if (!filePath) {
  //     alert('请先选择一个文件！');
  //     return;
  //   }
  //   const result = await window.api.executeFile(filePath);
  //   if (result.success) {
  //     setExecResult('✅ 文件已成功启动！');
  //     setIsRunning(true);
  //     setMessage('✅ 应用正在运行中...');
  //     setElapsedTime(0); // 重置计时器显示
  //   } else {
  //     setIsRunning(false);
  //     setExecResult(`❌ 启动失败: ${result.message}`);
  //   }
  // };
  useEffect(() => {
    fetchGames();
    // 监听计时器更新
    window.api.onTimerUpdate((time) => {
      setElapsedTime(time);
    });

    // 监听进程停止
    window.api.onTimerStopped((result) => {
      setIsRunning(false);
      setMessage(
        `应用已关闭。总运行时间: ${formatTime(result.finalElapsedTime)} (退出码: ${result.code})`,
      );
    });
  }, []);
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
      fetchGames(); // 重新加载游戏数据以更新游戏时间
    });
  }, [fetchGames, runningGame]);
  //添加游戏
  const handleAddGame = async () => {
    const path = await window.api.openFile();
    if (!path) return;

    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏';
    const gameName = prompt('请输入游戏名称：', defaultName);
    if (!gameName) return;

    try {
      await window.api.addGame({ gameName, launchPath: path });
      setMessage(`✅ 游戏《${gameName}》已成功添加！`);
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
      return;
    }
    setMessage(`正在启动《${game.game_name}》...`);
    const result = await window.api.executeFile({ id: game.id, path: game.launch_path });
    if (result.success) {
      setRunningGame(game);
      setElapsedTime(0);
      setMessage(`《${game.game_name}》正在运行...`);
    } else {
      setMessage(`❌ 启动失败: ${result.message}`);
    }
  };
  return (
    <>
      <button onClick={handleAddGame} disabled={!!runningGame}>添加新游戏</button>
      {/* <button onClick={dianji} disabled={isRunning} className="text-amber-500">
        选择文件
      </button>
      <div>
        {filePath && (
          <div>
            <p>已选择的文件:</p>
            <p>{filePath}</p>
          </div>
        )}
        {filePath?.toLowerCase().endsWith('.exe') && (
          <button
            onClick={runFile}
            disabled={isRunning}
            className="text-green-500"
          >
            {isRunning ? '运行中' : '运行此文件'}
          </button>
        )}
        {execResult && <p>{execResult}</p>}
        <div>
          {isRunning && <h2>运行时间: {formatTime(elapsedTime)}</h2>}
          {message && <p>{message}</p>}
        </div>
      </div> */}
      {/* 游戏列表 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={styles.th}>游戏名称</th>
            <th style={styles.th}>总游戏时长</th>
            <th style={styles.th}>启动次数</th>
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <td style={styles.td}>{game.game_name}</td>
              <td style={styles.td}>{formatTime(game.total_play_time)}</td>
              <td style={styles.td}>{game.launch_count}</td>
              <td style={styles.td}>
                <button onClick={() => handleRunGame(game)} disabled={!!runningGame}>运行</button>
                <button onClick={() => handleDeleteGame(game)} disabled={!!runningGame} style={{ marginLeft: '10px' }}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
  
}
const styles: { th: React.CSSProperties; td: React.CSSProperties } = {
  th: { border: '1px solid #ccc', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
  td: { border: '1px solid #ccc', padding: '8px' }
};
export default App;
