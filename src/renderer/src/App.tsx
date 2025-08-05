import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, formatTimeCalender } from './util/timeFormat';
import gameSizeFormat from './util/gameSizeFormat';
import type { Game, Banners } from './types/Game';
import { Link } from 'react-router-dom';

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
      await window.api.addGame({ gameName: defaultName, launchPath: path });
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
      console.log(runningGame);
      return;
    }
    setMessage(`正在启动《${game.game_name}》...`);
    const result = await window.api.executeFile({
      id: game.id,
      path: game.launch_path,
    });
    console.log(result);
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
    const oldFilePath = (BannersRef.current?.find(i=>i.game_id===game.id))?.relative_path as string
    if (!path) return;
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
      <button onClick={handleAddGame}>添加新游戏</button>
      <Link to={'/updata'} className='ml-5'>
        <button>更新记录</button>
      </Link>
      {/* 游戏列表 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={styles.th}>封面图</th>
            <th style={styles.th}>游戏名称</th>
            <th style={styles.th}>总游戏时长</th>
            <th style={styles.th}>启动次数</th>
            <th style={styles.th}>上次启动时间</th>
            <th style={styles.th}>游戏大小</th>
            {/* <th style={styles.th}>创建时间</th>
            <th style={styles.th}>更新时间</th> */}
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              {BannersRef.current?.find((i: Banners) => i.game_id === game.id) ? (
                <td style={styles.td}>
                  <img
                    src={'lop://' + BannersRef.current
                        ?.find((i: Banners) => i.game_id === game.id)
                        ?.relative_path?.replace(/\\/g, '/')
                        }
                    alt="banner图"
                    className="w-60 h-40"
                  />
                </td>
              ) : (
                <td style={styles.td}><img src="lop://default.jpg" alt="默认封面图" className='w-60 h-40'/></td>
              )}
              <td style={styles.td}>{game.game_name}</td>
              <td style={styles.td}>{formatTime(game.total_play_time)}</td>
              <td style={styles.td}>{game.launch_count}</td>
              <td style={styles.td}>
                {game.last_launch_time
                  ? formatTimeCalender(game.last_launch_time)
                  : '暂无'}
              </td>
              <td style={styles.td}>{gameSizeFormat(game.disk_size)}</td>
              {/* <td style={styles.td}>{formatTimeCalender(game.created_at)}</td>
              <td style={styles.td}>{formatTimeCalender(game.updated_at)}</td> */}
              <td style={styles.td}>
                <button onClick={() => handleRunGame(game)}>运行</button>
                <button
                  onClick={() => handleDeleteGame(game)}
                  style={{ marginLeft: '10px' }}
                >
                  删除
                </button>
                <button
                  onClick={() => handleAddBanner(game)}
                  style={{ marginLeft: '10px' }}
                >
                  封面
                </button>
                <Link to={`/gallery/${game.id}`}>
                  <button>图集</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {`消息通知 :${message}`}
      {elapsedTime ? `运行时间 :${formatTime(elapsedTime)}` : <></>}
    </>
  );
}
const styles: { th: React.CSSProperties; td: React.CSSProperties } = {
  th: {
    border: '1px solid #ccc',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  },
  td: { border: '1px solid #ccc', padding: '0px' },
};
export default App;
