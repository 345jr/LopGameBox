import path from 'path';

// 处理 需要删除的旧封面图路径
export const getDelectPath = (oldFilePath: string) => {
  if (oldFilePath === 'banner\\default.jpg') {
    console.log(`default image skip`);
    return 'skip';
  }
  if (oldFilePath === 'skip') return 'skip';
  const filePath = path.join('public', ...oldFilePath.split('\\'));
  return filePath;
};
