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
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}`;
}
