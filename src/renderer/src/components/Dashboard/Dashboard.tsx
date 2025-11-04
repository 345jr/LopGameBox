import { useEffect, useState } from 'react';
import { GameStatistics } from '@renderer/types/Game';
import { GameLog } from '@renderer/types/Game';
import MyAreaChart from './MyAreaChart';
import MyPieChart from './MyPieChart';
import { getWeekRange, formatTimeToHours } from '@renderer/util/timeFormat';
import gameSizeFormat from '@renderer/util/gameSizeFormat';

const Dashboard = () => {
  const [gameStatistics, setGameStatistics] = useState<GameStatistics>({
    gameCount: 0,
    gamePlayTime: 0,
    launchCount: 0,
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    normalHours: 0,
    fastHours: 0,
    afkHours: 0,
    infinityHours: 0,
    totalDiskSize: 0,
  });
  const [weekGameLogsData, setWeekGameLogsData] = useState<GameLog[]>([]);

  const [isNowWeek, setIsNowWeek] = useState(false);

  //饼图数据

  //获取统计数据方法
  const getData = async () => {
    //异步+并发+解构
    const [{ count }, { timeCount }, { launchCount }] = await Promise.all([
      window.api.countGames(),
      window.api.countGameTime(),
      window.api.countLaunchTimes(),
    ]);
    //获取本日 ，本周 ，本月的记录
    const { todayHours, weekHours, monthHours } = await window.api.countDayWeekMonth();
    //获取4种模式下的游戏时长分布
    const { normalHours, fastHours, afkHours, infinityHours } = await window.api.getGameLogByMode();

    //获取所有游戏数据，计算总存储占用
    const allGames = await window.api.getAllGames();
    const totalDiskSize = allGames.reduce((sum, game) => sum + (game.disk_size || 0), 0);

    //获取本周的时长分布
    // const weekGameLogs = await window.api.getGameLogByModeThisWeek();
    //获取上周的时长分布
    const lastWeekGameLogs = await window.api.getGameLogByModeLastWeek();

    const StatisticsObject: GameStatistics = {
      gameCount: count,
      gamePlayTime: timeCount,
      launchCount: launchCount,
      todayHours: todayHours,
      weekHours: weekHours,
      monthHours: monthHours,
      normalHours: normalHours,
      fastHours: fastHours,
      afkHours: afkHours,
      infinityHours: infinityHours,
      totalDiskSize: totalDiskSize,
    };
    setGameStatistics(StatisticsObject);
    setWeekGameLogsData(lastWeekGameLogs);
  };
  //切换本周数据
  const switchToWeekData = async () => {
    setIsNowWeek(true);
    const weekGameLogs = await window.api.getGameLogByModeThisWeek();
    setWeekGameLogsData(weekGameLogs);
  };
  //切换回上周
  const switchToLastWeekData = async () => {
    setIsNowWeek(false);
    const lastWeekGameLogs = await window.api.getGameLogByModeLastWeek();
    setWeekGameLogsData(lastWeekGameLogs);
  };
  //获取统计数据
  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <div className="mb-4">
        {/* 统计数据卡片式展示 */}
        <div className="mb-8 mx-auto max-w-full">
          <div className="grid grid-cols-4 gap-4 px-4 mt-4">
            {/* 游戏总数 */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-xs mb-2">游戏总数</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{gameStatistics.gameCount}</p>
              <p className="text-slate-500 text-xs">总计统计</p>
            </div>

            {/* 总游戏时间 */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-xs mb-2">总游戏时间</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{formatTimeToHours(gameStatistics.gamePlayTime)}</p>
              <p className="text-slate-500 text-xs">累计游玩</p>
            </div>

            {/* 总启动次数 */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-xs mb-2">总启动次数</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{gameStatistics.launchCount}</p>
              <p className="text-slate-500 text-xs">启动统计</p>
            </div>

            {/* 总存储占用 */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-xs mb-2">总存储占用</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{gameSizeFormat(gameStatistics.totalDiskSize)}</p>
              <p className="text-slate-500 text-xs">本地占用空间</p>
            </div>
          </div>
        </div>
        {/* 饼图数据看板 */}
        <MyPieChart gameStatistics={gameStatistics} />
        {/* 本周在不同模式下的游戏时间分布: */}
        <div className="flex flex-row justify-center">
          {isNowWeek ? (
            <>
              {/* 本周 */}
              <button className="ml-2">时间范围:{getWeekRange(isNowWeek)}</button>
            </>
          ) : (
            <>
              {/* 上周 */}
              <button className="ml-2">时间范围:{getWeekRange(isNowWeek)}</button>
            </>
          )}
          {isNowWeek ? (
            <button onClick={switchToLastWeekData} className="ml-2 cursor-pointer">
              查看上周
            </button>
          ) : (
            <button onClick={switchToWeekData} className="ml-2 cursor-pointer">
              查看本周
            </button>
          )}
        </div>
        {/* 周数据看板 */}
        <MyAreaChart gameStatistics={gameStatistics} weekGameLogsData={weekGameLogsData} />
      </div>
    </>
  );
};

export default Dashboard;
