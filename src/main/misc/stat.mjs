// import * as fs from 'fs/promises';
// const nihao = fs.lstat('index.ts', (err, data) => {
//   if (err) {
//     console.error('读取失败:', err);
//     return;
//   }
//   console.log('hello world')
//   console.log('文件大小:', data.size);
//   console.log('最后修改:', data.mtime);
// });
// import * as fs from 'fs/promises';

// fs.lstat('index.ts')
//   .then(data => {
//     console.log('hello world');
//     console.log('文件大小:', data.size);
//     console.log('最后修改:', data.mtime);
//   })
//   .catch(err => {
//     console.error('读取失败:', err);
//   });
import * as fs from 'fs/promises';

async function checkFile() {
  try {
    const data = await fs.lstat('index.ts');
    console.log('hello world');
    console.log('文件大小:', data.size);
    console.log('最后修改:', data.mtime);
  } catch (err) {
    console.error('读取失败:', err);
  }
}

checkFile();