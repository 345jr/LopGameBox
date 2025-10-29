import path from 'path';
import { app } from 'electron';

// 处理需要删除的旧封面图路径——仅使用 userData
export const getDelectPath = (oldFilePath: string) => {
  if (oldFilePath === 'banner\\default.jpg') {
    console.log(`default image skip`);
    return 'skip';
  }
  if (oldFilePath === 'skip') return 'skip';

  // 规范相对路径
  const rel = oldFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const userDataPath = path.join(app.getPath('userData'), rel);
  return userDataPath;
};
