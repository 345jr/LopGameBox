{/_ 本周在不同模式下的游戏时间分布: _/}
<div className="flex flex-row justify-center">
{isNowWeek ? (
<>
{/_ 本周 _/}
<button className="ml-2">时间范围:{getWeekRange(isNowWeek)}</button>
</>
) : (
<>
{/_ 上周 _/}
<button className="ml-2">时间范围:{getWeekRange(isNowWeek)}</button>
</>
)}
{isNowWeek ? (
<button onClick={() => setIsNowWeek(false)} className="ml-2 cursor-pointer">查看上周</button>
) : (
<button onClick={() => setIsNowWeek(true)} className="ml-2 cursor-pointer">查看本周</button>
)}
</div>
<div className="flex h-75 w-full flex-row">
{/_ 周时长看板 _/}
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
className="p-2" >
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
