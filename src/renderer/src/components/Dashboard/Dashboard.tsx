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
      <div className="mb-4 px-4">
        {/* 饼图和区域图并排展示 */}
        <div className="mb-4 grid grid-cols-[30%_70%] gap-2 mt-4">
          <div className="gird grid-rows-2 gap-4">
            {/* 饼图卡片 */}
            <div className="dashboardCard p-6 mb-4">
              <h3 className="mb-2 text-lg font-semibold text-black">全模式游玩占比</h3>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <MyPieChart gameStatistics={gameStatistics} />
                </div>
              </div>
            </div>
            {/* 周数据统计卡片 */}
            <div className="">
              <div className="grid grid-cols-1 gap-2">
                {/* 今日时长 */}
                <div className="dashboardCard p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">今日时长</p>
                    <p className="text-lg font-bold text-gray-900">
                      {gameStatistics.todayHours.toFixed(2)}h
                    </p>
                  </div>
                </div>

                {/* 本周时长 */}
                <div className="dashboardCard p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">本周时长</p>
                    <p className="text-lg font-bold text-gray-900">
                      {gameStatistics.weekHours.toFixed(2)}h
                    </p>
                  </div>
                </div>

                {/* 本月时长 */}
                <div className="dashboardCard p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">本月时长</p>
                    <p className="text-lg font-bold text-gray-900">
                      {gameStatistics.monthHours.toFixed(2)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 区域图卡片 */}
          <div className="dashboardCard p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">周游玩总览</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-center gap-4">
                {isNowWeek ? (
                  <>
                    <button className="text-sm">时间范围:{getWeekRange(isNowWeek)}</button>
                    <button
                      onClick={switchToLastWeekData}
                      className="cursor-pointer text-sm hover:text-blue-600"
                    >
                      查看上周
                    </button>
                  </>
                ) : (
                  <>
                    <button className="text-sm">时间范围:{getWeekRange(isNowWeek)}</button>
                    <button
                      onClick={switchToWeekData}
                      className="cursor-pointer text-sm hover:text-blue-600"
                    >
                      查看本周
                    </button>
                  </>
                )}
              </div>
              <div className="w-full">
                <MyAreaChart weekGameLogsData={weekGameLogsData} />
              </div>
            </div>
          </div>
        </div>

        {/* 统计数据卡片式展示 */}
        <div className="mx-auto mb-8 max-w-full">
          <div className="mt-4 grid grid-cols-4 gap-4">
            {/* 游戏总数 */}
            <div className="dashboardCard p-6">
              <p className="mb-2 text-xs text-slate-600">游戏总数</p>
              <p className="mb-1 text-3xl font-bold text-slate-900">{gameStatistics.gameCount}</p>
              <p className="text-xs text-slate-500">总计统计</p>
            </div>

            {/* 总游戏时间 */}
            <div className="dashboardCard p-6">
              <p className="mb-2 text-xs text-slate-600">总游戏时间</p>
              <p className="mb-1 text-3xl font-bold text-slate-900">
                {formatTimeToHours(gameStatistics.gamePlayTime)}
              </p>
              <p className="text-xs text-slate-500">累计游玩</p>
            </div>

            {/* 总启动次数 */}
            <div className="dashboardCard p-6">
              <p className="mb-2 text-xs text-slate-600">总启动次数</p>
              <p className="mb-1 text-3xl font-bold text-slate-900">{gameStatistics.launchCount}</p>
              <p className="text-xs text-slate-500">启动统计</p>
            </div>

            {/* 总存储占用 */}
            <div className="dashboardCard p-6">
              <p className="mb-2 text-xs text-slate-600">总存储占用</p>
              <p className="mb-1 text-3xl font-bold text-slate-900">
                {gameSizeFormat(gameStatistics.totalDiskSize)}
              </p>
              <p className="text-xs text-slate-500">本地占用空间</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
