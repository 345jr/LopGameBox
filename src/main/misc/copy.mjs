import * as fs from 'fs/promises';
import path from "path";
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // 将 URL 转换为文件路径
const __dirname = path.dirname(__filename); // 获取当前文件所在的目录

const sourcePath = path.resolve(__dirname, 'copy.mjs');
const desktopPath = path.join(os.homedir(), 'Desktop');
const destPath = path.resolve(desktopPath, 'destination.txt');


(async () => {
    try {
        await fs.copyFile(sourcePath, destPath);
        console.log('✅ 文件复制成功！');
        console.log('复制到路径:', desktopPath);
    } catch (error) {
        console.error('❌ 复制失败:', error);
    }
})();