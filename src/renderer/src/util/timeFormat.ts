import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(utc);
dayjs.extend(weekday);

// 运行时间格式化: 秒 -> HH:mm:ss
export function formatTime(elapsedSeconds: number): string {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// 日期格式化: 接受秒为单位的时间戳
export function formatTimeCalender(seconds: number): string {
  return dayjs(seconds * 1000).format('YYYY年M月D日');
}

// 秒 -> 小时（保留两位小数）
export function formatTimeToHours(seconds: number | undefined): string {
  if (seconds === undefined) return '0';
  return (seconds / 3600).toFixed(2);
}

// 秒 -> 分钟（向下取整）
export function formatTimeToMinutes(seconds: number | undefined): string {
  if (seconds === undefined) return '0';
  return `${Math.floor(seconds / 60)}`;
}

// 获取本周或上周范围字符串
export const getWeekRange = (isNowWeek: boolean): string => {
  // 使用 dayjs 的 weekday 插件，使得周一为起始日
  const now = dayjs();
  // 获取本周一
  const thisMonday = now.weekday(1).startOf('day');
  const start = isNowWeek ? thisMonday : thisMonday.subtract(7, 'day');
  const end = start.add(6, 'day');
  const fmt = (d: dayjs.Dayjs) => d.format('YYYY年M月D日');
  return `${fmt(start)} - ${fmt(end)}`;
};
