import { getWeekRange } from "@renderer/util/timeFormat";
import { useState } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, AreaChart,Area } from "recharts";
//临时数据
const data = [
  {
    name: '周一',
    普通模式: 2.5,
    快速模式: 1.2,
    挂机模式: 3.8,
    沉浸模式: 4.1,
  },
  {
    name: '周二',
    普通模式: 1.8,
    快速模式: 2.3,
    挂机模式: 2.1,
    沉浸模式: 3.5,
  },
  {
    name: '周三',
    普通模式: 3.2,
    快速模式: 1.5,
    挂机模式: 4.2,
    沉浸模式: 2.8,
  },
  {
    name: '周四',
    普通模式: 2.1,
    快速模式: 3.1,
    挂机模式: 1.9,
    沉浸模式: 4.6,
  },
  {
    name: '周五',
    普通模式: 4.3,
    快速模式: 2.8,
    挂机模式: 3.3,
    沉浸模式: 1.7,
  },
  {
    name: '周六',
    普通模式: 3.8,
    快速模式: 4.1,
    挂机模式: 2.6,
    沉浸模式: 5.2,
  },
  {
    name: '周日',
    普通模式: 2.9,
    快速模式: 3.4,
    挂机模式: 4.7,
    沉浸模式: 3.8,
  },
];
// 自定义提示框组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="max-w-48 rounded border border-gray-300 bg-white p-2 text-sm shadow-md">
        <p className="mb-1 font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {`${entry.dataKey}: ${entry.value}小时`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
const MyAreaChart = ({gameStatistics}) => {
      const [isNowWeek, setIsNowWeek] = useState(false);
    
  return (
    <>
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
          <button onClick={() => setIsNowWeek(false)} className="ml-2 cursor-pointer">
            查看上周
          </button>
        ) : (
          <button onClick={() => setIsNowWeek(true)} className="ml-2 cursor-pointer">
            查看本周
          </button>
        )}
      </div>
      <div className="flex h-75 w-full flex-row">
        {/* 周时长看板 */}
        <ResponsiveContainer width="75%" height="100%">
          <AreaChart
            width={500}
            height={400}
            data={data}
            margin={{
              top: 0,
              right: 0,
              left: 30,
              bottom: 0,
            }}
            className="p-2"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, 'dataMax']}
              tickFormatter={(value) => `${value}h`}
              tickCount={5}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="普通模式" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area type="monotone" dataKey="快速模式" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            <Area type="monotone" dataKey="挂机模式" stackId="1" stroke="#ffc658" fill="#ffc658" />
            <Area type="monotone" dataKey="沉浸模式" stackId="1" stroke="#ff7300" fill="#ff7300" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-col">
          <p>今日时长:{gameStatistics.todayHours.toFixed(2)}</p>
          <p>本周时长:{gameStatistics.weekHours.toFixed(2)}</p>
          <p>本月时长:{gameStatistics.monthHours.toFixed(2)}</p>
        </div>
      </div>
    </>
  );
};

export default MyAreaChart;
