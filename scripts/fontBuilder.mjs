import Fontmin from 'fontmin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从文本文件读取字符
const textFilePath = path.join(__dirname, 'font-text.txt');
let text = '';

try {
  text = fs.readFileSync(textFilePath, 'utf8').trim();
  console.log(`✓ 已读取字符文本`);
} catch (err) {
  console.error(`❌ 读取字符文件失败: ${err.message}`);
  process.exit(1);
}

// 路径准备与检查
const srcFontPath = path.resolve(__dirname, '../fonts/LXGWWenKai-Medium.ttf');
const destDir = path.resolve(__dirname, '../src/renderer/src/fonts');

if (!fs.existsSync(srcFontPath)) {
  console.error(`❌ 源字体不存在: ${srcFontPath}`);
  console.error('请确认 fonts 目录下存在 LXGWWenKai-Medium.ttf');
  process.exit(1);
}

// 确保输出目录存在
fs.mkdirSync(destDir, { recursive: true });

if (!text) {
  console.warn('⚠️ 字符文本为空，将不会裁剪任何字形（可能生成原字体的副本）。');
}

console.log('🔄 开始字体转换...');

const fontmin = new Fontmin();
fontmin
  .use(
    Fontmin.glyph({
      text: text,
      hinting: true
    }),
  )
  // 使用绝对路径，避免 npm run 时相对路径解析错误
  .src(srcFontPath)
  .dest(destDir);

fontmin.run(function (err, files) {
  if (err) {
    console.error('❌ 字体转换失败:', err.message);
    throw err;
  }
  
  console.log('✅ 字体转换完成!');
  console.log(`📁 输出目录: ${path.resolve(__dirname, '../src/renderer/src/fonts')}`);
  console.log(`📊 生成文件数量: ${files.length}`);
});
