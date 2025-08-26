import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { GameStatistics } from '@renderer/types/Game';
import { GameLog } from '@renderer/types/Game';
import MyAreaChart from './MyAreaChart';
import MyPieChart from './MyPieChart';
import { getWeekRange } from '@renderer/util/timeFormat';

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
      <div className="text-center">统计面板</div>
      <div className="mt-5 text-xl">
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
            <button
              onClick={switchToWeekData}
              className="ml-2 cursor-pointer"
            >
              查看本周
            </button>
          )}
        </div>
        {/* 周数据看板 */}
        <MyAreaChart gameStatistics={gameStatistics} weekGameLogsData={weekGameLogsData} />
        <div className="mt-5 text-center">
          <Link to={'/'}>
            <button className="cursor-pointer">返回主页</button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
