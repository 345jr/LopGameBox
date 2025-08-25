import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { GameStatistics } from '@renderer/types/Game';
import MyAreaChart from './MyAreaChart';
import MyPieChart from './MyPieChart';

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
        {/* 周数据看板 */}
        <MyAreaChart gameStatistics={gameStatistics} />
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
