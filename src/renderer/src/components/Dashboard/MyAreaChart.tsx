import { useMemo } from 'react'
import type { GameLog } from '@renderer/types/Game'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts'

type AreaTooltipProps = {
  active?: boolean
  label?: string
  payload?: Array<{
    color?: string
    dataKey?: string | number
    value?: number
    payload?: { 总时长?: number }
  }>
}

// 自定义提示框组件
const CustomTooltip = ({ active, payload, label }: AreaTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="max-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-gray-800">{`${label}`}</p>
      <div className="space-y-0.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.dataKey}</span>
            <span className="ml-auto pl-3 text-gray-700 tabular-nums">{entry.value}h</span>
          </div>
        ))}
      </div>
      <p className="mt-1.5 border-t border-gray-100 pt-1.5 text-gray-600 tabular-nums">
        当日总时长 {payload[0].payload?.总时长}h
      </p>
    </div>
  )
}

type Props = {
  weekGameLogsData: GameLog[]
}

const MyAreaChart = ({ weekGameLogsData }: Props) => {
  // 将父组件传来的周日志转换为图表所需的数据结构
  const chartData = useMemo(
    () =>
      (weekGameLogsData || []).map((d) => ({
        name: d.play_date.slice(5),
        普通模式: d.normalHours.toFixed(1) ?? 0,
        快速模式: d.fastHours.toFixed(1) ?? 0,
        挂机模式: d.afkHours.toFixed(1) ?? 0,
        沉浸模式: d.infinityHours.toFixed(1) ?? 0,
        总时长: d.totalHours.toFixed(1) ?? 0
      })),
    [weekGameLogsData]
  )

  return (
    <div className="h-110 w-full">
      {/* 周时长看板 */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 8,
            right: 8,
            left: 0,
            bottom: 0
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={(value) => `${value}h`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="plainline" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="普通模式"
            stackId="1"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="快速模式"
            stackId="1"
            stroke="#facc15"
            fill="#facc15"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="挂机模式"
            stackId="1"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="沉浸模式"
            stackId="1"
            stroke="#f472b6"
            fill="#f472b6"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MyAreaChart
