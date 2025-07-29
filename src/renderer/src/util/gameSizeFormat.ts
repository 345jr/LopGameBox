export default function formatFileSize(bytes:number) {
  if (!bytes || bytes === 0) return '0 KB';
  // 转换为KB
  const kb = bytes / 1024;
  // 如果小于1MB，显示KB
  if (kb < 1024) {
    return Math.round(kb) + ' KB';
  }
  // 转换为MB
  const mb = kb / 1024;
  // 如果小于1GB，显示MB
  if (mb < 1024) {
    return Math.round(mb) + ' MB';
  }
  // 转换为GB
  const gb = mb / 1024;
  return gb.toFixed(1) + ' GB';
}

