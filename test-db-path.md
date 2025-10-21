# 数据库路径说明

## 开发环境
- 路径：`项目根目录/db/gameData.db`
- 示例：`C:\My Projects\JSandTS\Electron\lopgamebox\db\gameData.db`

## 生产环境（打包后）
- 路径：`用户数据目录/gameData.db`
- Windows 示例：`C:\Users\用户名\AppData\Roaming\LopGameBox\gameData.db`
- 备份路径：`C:\Users\用户名\AppData\Roaming\LopGameBox\backups\`

## 用户数据目录位置

### Windows
- `%APPDATA%\LopGameBox`
- 完整路径：`C:\Users\{用户名}\AppData\Roaming\LopGameBox`

### macOS
- `~/Library/Application Support/LopGameBox`

### Linux
- `~/.config/LopGameBox`

## 优势

1. ✅ **数据持久化**：应用更新不会丢失用户数据
2. ✅ **自动创建**：首次运行自动创建空数据库
3. ✅ **独立性**：每个用户都有独立的数据库
4. ✅ **标准实践**：符合操作系统的最佳实践
5. ✅ **安装包更小**：不包含数据库文件

## 测试方法

1. 打包应用：`npm run build:win`
2. 安装并运行应用
3. 打开日志，查看 "数据库路径:" 输出
4. 确认数据库在用户数据目录创建成功
