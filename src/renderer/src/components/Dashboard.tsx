import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeToHours } from '@renderer/util/timeFormat';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { GameStatistics } from '@renderer/types/Game';

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

// 饼图自定义提示框
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="max-w-32 rounded border border-gray-300 bg-white p-2 text-sm shadow-md">
        <p className={`font-medium`} style={{ color: data.payload.color }}>
          {data.name}
        </p>
        <p className="text-xs">{`${data.value.toFixed(2)}小时`}</p>
      </div>
    );
  }
  return null;
};

// 饼图颜色配置
const PIE_COLORS = ['#84cc16', '#eab308', '#0ea5e9', '#a855f7'];

// 自定义饼图标签渲染函数
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  // 在饼图外部25像素的位置
  const radius = outerRadius + 10;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="500"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

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
  const PIE_DATA = [
    { name: '普通模式', value: gameStatistics.normalHours },
    { name: '快速模式', value: gameStatistics.fastHours },
    { name: '挂机模式', value: gameStatistics.afkHours },
    { name: '沉浸模式', value: gameStatistics.infinityHours },
  ];

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

  //获取本周的时间范围
  const getWeekRange = () => {
    let now = new Date();
    let endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 6);
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 
    - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
  };

  return (
    <>
      <div className='text-center'>统计面板</div>
      <div className="mt-5 text-xl">
        <div className="flex flex-row">
          <div className="flex flex-col">
            <p>游戏总数:{gameStatistics.gameCount}</p>
            <p>总游戏时间:{formatTimeToHours(gameStatistics.gamePlayTime)}</p>
            <p>总游戏启动次数:{gameStatistics.launchCount}</p>
          </div>
          {/* 不同模式的时长比例图 */}
          <div className="h-80 w-110">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: '普通模式',
                      value: gameStatistics.normalHours,
                      normalHours: gameStatistics.normalHours,
                      fastHours: gameStatistics.fastHours,
                      afkHours: gameStatistics.afkHours,
                      infinityHours: gameStatistics.infinityHours,
                      color: PIE_COLORS[0],
                    },
                    {
                      name: '快速模式',
                      value: gameStatistics.fastHours,
                      normalHours: gameStatistics.normalHours,
                      fastHours: gameStatistics.fastHours,
                      afkHours: gameStatistics.afkHours,
                      infinityHours: gameStatistics.infinityHours,
                      color: PIE_COLORS[1],
                    },
                    {
                      name: '挂机模式',
                      value: gameStatistics.afkHours,
                      normalHours: gameStatistics.normalHours,
                      fastHours: gameStatistics.fastHours,
                      afkHours: gameStatistics.afkHours,
                      infinityHours: gameStatistics.infinityHours,
                      color: PIE_COLORS[2],
                    },
                    {
                      name: '沉浸模式',
                      value: gameStatistics.infinityHours,
                      normalHours: gameStatistics.normalHours,
                      fastHours: gameStatistics.fastHours,
                      afkHours: gameStatistics.afkHours,
                      infinityHours: gameStatistics.infinityHours,
                      color: PIE_COLORS[3],
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {PIE_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend align={'right'} layout="vertical" verticalAlign="top" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 本周在不同模式下的游戏时间分布: */}
        <p className='text-center'>时间范围 : {getWeekRange()}</p>
        <div className="flex h-75 w-full flex-row">
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
              <Area
                type="monotone"
                dataKey="普通模式"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="快速模式"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
              <Area
                type="monotone"
                dataKey="挂机模式"
                stackId="1"
                stroke="#ffc658"
                fill="#ffc658"
              />
              <Area
                type="monotone"
                dataKey="沉浸模式"
                stackId="1"
                stroke="#ff7300"
                fill="#ff7300"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-col">
            <p>今日时长:{gameStatistics.todayHours.toFixed(2)}</p>
            <p>本周时长:{gameStatistics.weekHours.toFixed(2)}</p>
            <p>本月时长:{gameStatistics.monthHours.toFixed(2)}</p>
          </div>
        </div>

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
