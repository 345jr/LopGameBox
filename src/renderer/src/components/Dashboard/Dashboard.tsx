import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GameStatistics } from '@renderer/types/Game'
import MyAreaChart from './MyAreaChart'
import MyPieChart from './MyPieChart'
import { getWeekRange, formatTimeToHours } from '@renderer/util/timeFormat'
import gameSizeFormat from '@renderer/util/gameSizeFormat'
import { queryKeys } from '@renderer/api/queryKeys'

const emptyStats: GameStatistics = {
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
  totalDiskSize: 0
}

const fetchDashboardStats = async (): Promise<GameStatistics> => {
  const [{ count }, { timeCount }, { launchCount }] = await Promise.all([
    window.api.countGames(),
    window.api.countGameTime(),
    window.api.countLaunchTimes()
  ])
  const { todayHours, weekHours, monthHours } = await window.api.countDayWeekMonth()
  const { normalHours, fastHours, afkHours, infinityHours } = await window.api.getGameLogByMode()
  const allGames = await window.api.getAllGames()
  const totalDiskSize = allGames.reduce((sum, game) => sum + (game.disk_size || 0), 0)

  return {
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
    totalDiskSize: totalDiskSize
  }
}

const Dashboard = () => {
  const [isNowWeek, setIsNowWeek] = useState(false)

  // 总览统计：用 React Query 拉数，避免 effect 内同步 setState
  const { data: gameStatistics = emptyStats } = useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: fetchDashboardStats
  })

  // 周游玩曲线：本周 / 上周切换
  const { data: weekGameLogsData = [] } = useQuery({
    queryKey: queryKeys.dashboardWeekLogs(isNowWeek),
    queryFn: () =>
      isNowWeek ? window.api.getGameLogByModeThisWeek() : window.api.getGameLogByModeLastWeek()
  })

  const switchToWeekData = () => {
    setIsNowWeek(true)
  }
  const switchToLastWeekData = () => {
    setIsNowWeek(false)
  }

  return (
    <>
      <div className="mb-4 px-4">
        {/* 统计数据卡片式展示 */}
        <div className="mx-auto mt-4 mb-4 max-w-full">
          <div className="grid grid-cols-4 gap-4">
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
                {formatTimeToHours(gameStatistics.gamePlayTime)}h
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
        {/* 饼图和区域图并排展示 */}
        <div className="mt-4 mb-4 grid grid-cols-[30%_70%] gap-2">
          <div className="gird grid-rows-2 gap-4">
            {/* 饼图卡片 */}
            <div className="dashboardCard mb-4 p-6">
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
          <div className="dashboardCard flex flex-col p-6">
            {/* 顶部一排字 */}
            <div className="flex flex-row">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">周游玩总览</h3>
              <div className="mb-2.5 ml-4 flex flex-row justify-center gap-4">
                {isNowWeek ? (
                  <>
                    <button className="text-sm">时间范围:{getWeekRange(isNowWeek)}</button>
                    <button
                      onClick={switchToLastWeekData}
                      className="cursor-pointer text-sm text-blue-600 hover:underline"
                    >
                      查看上周
                    </button>
                  </>
                ) : (
                  <>
                    <button className="text-sm">时间范围:{getWeekRange(isNowWeek)}</button>
                    <button
                      onClick={switchToWeekData}
                      className="cursor-pointer text-sm text-blue-600 hover:underline"
                    >
                      查看本周
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <MyAreaChart weekGameLogsData={weekGameLogsData} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
