import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeToHours } from '@renderer/util/timeFormat';

import { GameStatistics } from '@renderer/types/Game';
const Dashboard = () => {
  const [gameStatistics, setGameStatistics] = useState<GameStatistics>({
    gameCount: 0,
    gamePlayTime: 0,
    launchCount: 0,
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
  });
  //获取统计数据方法
  const getData = async () => {
    //异步+并发+解构
    const [{ count }, { timeCount }, { launchCount }] = await Promise.all([
      window.api.countGames(),
      window.api.countGameTime(),
      window.api.countLaunchTimes(),
    ]);
    //获取本日 ，本周 ，本月的记录
    const { todayHours, weekHours, monthHours } =
      await window.api.countDayWeekMonth();
    // console.log(result)
    const StatisticsObject: GameStatistics = {
      gameCount: count,
      gamePlayTime: timeCount,
      launchCount: launchCount,
      todayHours: todayHours,
      weekHours: weekHours,
      monthHours: monthHours,
    };
    setGameStatistics(StatisticsObject);
  };

  //获取统计数据
  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <div>统计面板页面</div>
      <div className="mt-5 text-xl">
        <p>游戏总数:{gameStatistics.gameCount}</p>
        <p>总游戏时间:{formatTimeToHours(gameStatistics.gamePlayTime)} 小时</p>
        <p>游戏启动次数:{gameStatistics.launchCount}</p>
        <p>今日时长:{gameStatistics.todayHours.toFixed(2)}</p>
        <p>本周时长:{gameStatistics.weekHours.toFixed(2)}</p>
        <p>本月时长:{gameStatistics.monthHours.toFixed(2)}</p>
        <Link to={'/'}>
          <button className="cursor-pointer">返回主页</button>
        </Link>
      </div>
    </>
  );
};

export default Dashboard;
