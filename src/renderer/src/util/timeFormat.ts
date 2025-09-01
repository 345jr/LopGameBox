//运行时间格式化
export function formatTime(elapsedSeconds: number): string {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
//日期格式化
export function formatTimeCalender(seconds: number): string {
  const date = new Date(seconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}
//秒->小时
export function formatTimeToHours(seconds: number | undefined): string {
  if (seconds === undefined) {
    return '0';
  }
  const hours = (seconds / 3600).toFixed(2);
  return `${hours}`;
}
//秒->分钟
export function formatTimeToMinutes(seconds: number | undefined): string {
  if (seconds === undefined) {
    return '0';
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}`;
}
//获取本周或者上周时间
export const getWeekRange = (isNowWeek: boolean): string => {
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const now = new Date();
  const monday = getMonday(now);
  const startOfWeek = isNowWeek
    ? monday
    : new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const format = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

  return `${format(startOfWeek)} - ${format(endOfWeek)}`;
};
