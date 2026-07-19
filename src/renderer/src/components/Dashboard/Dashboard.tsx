import { useState, type ComponentType, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiBarChart2, FiBox, FiClock, FiHardDrive, FiPieChart, FiPlay } from 'react-icons/fi'
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

/** 统一卡片容器（与设置中心同一语言） */
const cardClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-xs'

/** 卡片头部：图标 + 标题 + 说明，右侧可挂操作区 */
const CardHeader = ({
  icon: Icon,
  title,
  desc,
  action
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  desc?: string
  action?: ReactNode
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {desc && <p className="mt-0.5 truncate text-xs text-gray-400">{desc}</p>}
      </div>
    </div>
    {action}
  </div>
)

/** 顶部概览统计卡 */
const StatCard = ({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-gray-400">{label}</p>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon className="size-3.5" />
      </span>
    </div>
    <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
    <p className="mt-1 text-xs text-gray-400">{sub}</p>
  </div>
)

/** 本周 / 上周分段切换 */
const WeekSwitch = ({
  isNowWeek,
  onChange
}: {
  isNowWeek: boolean
  onChange: (nowWeek: boolean) => void
}) => (
  <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
    {[
      { key: true, label: '本周' },
      { key: false, label: '上周' }
    ].map((item) => (
      <button
        key={item.label}
        type="button"
        onClick={() => onChange(item.key)}
        className={`cursor-pointer rounded-md px-3 py-1 text-xs transition-colors ${
          isNowWeek === item.key
            ? 'bg-white font-medium text-gray-900 shadow-xs'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
)

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

  // 顶部概览卡片数据
  const overviewItems = [
    {
      icon: FiBox,
      label: '游戏总数',
      value: `${gameStatistics.gameCount}`,
      sub: '库中游戏'
    },
    {
      icon: FiClock,
      label: '总游戏时间',
      value: `${formatTimeToHours(gameStatistics.gamePlayTime)}h`,
      sub: '累计游玩'
    },
    {
      icon: FiPlay,
      label: '总启动次数',
      value: `${gameStatistics.launchCount}`,
      sub: '启动统计'
    },
    {
      icon: FiHardDrive,
      label: '总存储占用',
      value: gameSizeFormat(gameStatistics.totalDiskSize),
      sub: '本地占用空间'
    }
  ]

  // 近期时长条目
  const periodItems = [
    { label: '今日时长', value: gameStatistics.todayHours },
    { label: '本周时长', value: gameStatistics.weekHours },
    { label: '本月时长', value: gameStatistics.monthHours }
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-6">
      {/* 页头 */}
      <header className="px-1">
        <h1 className="text-lg font-semibold text-gray-900">统计面板</h1>
        <p className="mt-0.5 text-xs text-gray-400">游戏时长与模式分布一览</p>
      </header>

      {/* 概览统计 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {overviewItems.map((item) => (
          <StatCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            sub={item.sub}
          />
        ))}
      </div>

      {/* 图表区：左列占比 + 近期时长，右列周曲线 */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex flex-col gap-5">
          {/* 模式占比 */}
          <section className={cardClass}>
            <CardHeader icon={FiPieChart} title="全模式游玩占比" desc="各模式累计时长分布" />
            <div className="mt-4">
              <MyPieChart gameStatistics={gameStatistics} />
            </div>
          </section>

          {/* 近期时长 */}
          <section className={cardClass}>
            <CardHeader icon={FiClock} title="近期时长" desc="今日 / 本周 / 本月" />
            <div className="mt-2 divide-y divide-gray-100">
              {periodItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">
                    {item.value.toFixed(2)}
                    <span className="ml-0.5 text-xs font-normal text-gray-400">h</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 周游玩总览 */}
        <section className={`${cardClass} flex flex-col md:col-span-2`}>
          <CardHeader
            icon={FiBarChart2}
            title="周游玩总览"
            desc={getWeekRange(isNowWeek)}
            action={<WeekSwitch isNowWeek={isNowWeek} onChange={setIsNowWeek} />}
          />
          <div className="mt-4 min-h-0 flex-1">
            <MyAreaChart weekGameLogsData={weekGameLogsData} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
