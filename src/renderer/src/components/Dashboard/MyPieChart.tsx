import { Cell,  Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
  // 如果小于8%，则不显示标签
  if (Number((percent * 100).toFixed(1)) < 8) return null;
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

const MyPieChart = ({ gameStatistics }) => {
  //饼图数据
  const PIE_DATA = [
    { name: '普通模式', value: gameStatistics.normalHours },
    { name: '快速模式', value: gameStatistics.fastHours },
    { name: '挂机模式', value: gameStatistics.afkHours },
    { name: '沉浸模式', value: gameStatistics.infinityHours },
  ];
  return (
    <>
      <div className="flex flex-row justify-center">
        {/* 不同模式的时长比例图 */}
        <div className="h-64 w-80">
          <ResponsiveContainer >
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default MyPieChart;
