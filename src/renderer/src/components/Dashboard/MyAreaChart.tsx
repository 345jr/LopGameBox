import { useMemo } from 'react';
import type { GameLog } from '@renderer/types/Game';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

// 自定义提示框组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // console.log(payload);
    return (
      <div className="max-w-48 rounded border border-gray-300 bg-white p-2 text-sm shadow-md">
        <p className="mb-1 font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index}>
            <p style={{ color: entry.color }} className="text-xs">
              {`${entry.dataKey}: ${entry.value}小时`}
            </p>
          </div>
        ))}
        <p>当日总时长 :{payload[0].payload.总时长}小时</p>
      </div>
    );
  }
  return null;
};
type Props = {
  weekGameLogsData: GameLog[];
};

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
        总时长: d.totalHours.toFixed(1) ?? 0,
      })),
    [weekGameLogsData],
  );

  return (
    <>
      <div className="flex h-75 w-full flex-row">
        {/* 周时长看板 */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            width={500}
            height={400}
            data={chartData}
            margin={{
              top: 0,
              right: 0,
              left: 30,
              bottom: 0,
            }}
            className="p-2"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" />
            <YAxis tickFormatter={(value) => `${value}h`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="普通模式" stackId="1" stroke="#84cc16" fill="#84cc16" />
            <Area type="monotone" dataKey="快速模式" stackId="1" stroke="#eab308" fill="#eab308" />
            <Area type="monotone" dataKey="挂机模式" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" />
            <Area type="monotone" dataKey="沉浸模式" stackId="1" stroke="#a855f7" fill="#a855f7" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default MyAreaChart;
