import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { GameStatistics } from '@renderer/types/Game'

type PieSlice = {
  name: string
  value: number
  color: string
  percent: number
}

type PieTooltipProps = {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    payload?: PieSlice
  }>
}

// 饼图自定义提示框
const PieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-lg">
      <p className="font-medium" style={{ color: data.payload?.color }}>
        {data.name}
      </p>
      <p className="mt-0.5 text-gray-500 tabular-nums">
        {(data.value ?? 0).toFixed(2)}h · {data.payload?.percent.toFixed(1)}%
      </p>
    </div>
  )
}

// 模式配色：与顶栏模式渐变色系一致
const MODE_COLORS = ['#4ade80', '#facc15', '#60a5fa', '#f472b6']

const MyPieChart = ({ gameStatistics }: { gameStatistics: GameStatistics }) => {
  // 环形图数据（附带占比，供提示框与图例共用）
  const baseData = [
    { name: '普通模式', value: gameStatistics.normalHours },
    { name: '快速模式', value: gameStatistics.fastHours },
    { name: '挂机模式', value: gameStatistics.afkHours },
    { name: '沉浸模式', value: gameStatistics.infinityHours }
  ]
  const total = baseData.reduce((sum, d) => sum + d.value, 0)
  const data: PieSlice[] = baseData.map((d, index) => ({
    ...d,
    color: MODE_COLORS[index],
    percent: total > 0 ? (d.value / total) * 100 : 0
  }))

  return (
    <div>
      {/* 环形图 + 中心总时长 */}
      <div className="relative mx-auto h-44 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              cornerRadius={4}
              strokeWidth={0}
              dataKey="value"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* 中心文案 */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-semibold text-gray-900 tabular-nums">{total.toFixed(1)}h</p>
          <p className="text-[11px] text-gray-400">总时长</p>
        </div>
      </div>

      {/* 图例：色点 + 模式名 + 时长/占比 */}
      <ul className="mt-3 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.name}</span>
            <span className="ml-auto text-gray-400 tabular-nums">
              {d.value.toFixed(1)}h · {d.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MyPieChart
