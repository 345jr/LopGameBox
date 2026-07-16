# LopBox

游戏库管理器。底座已迁移到 **[Electrobun](https://electrobun.dev)**（Bun 主进程 + 系统 WebView）。

## 前置：安装 Bun

若 `bun` 命令找不到，先装 Bun 并**新开一个终端**（PATH 才会生效）：

```powershell
# 方式 A：npm 全局安装
npm i -g bun

# 方式 B：官方安装脚本 (Windows)
powershell -c "irm bun.sh/install.ps1 | iex"
```

本仓库实验环境已把 `bun.exe` 放到 `C:\Users\Mayn\.bun\bin`（通常已在用户 PATH 中）。  
若仍提示找不到命令：

1. 确认 `C:\Users\Mayn\.bun\bin` 或 `D:\nodejs\npm_global` 在系统「环境变量 → Path」里  
2. **关掉并重新打开** PowerShell / Cursor 终端  
3. 运行 `bun --version` 应输出版本号

## 开发

```bash
bun install
bun run dev          # 构建 UI + 启动 Electrobun
bun run dev:hmr      # Vite 热更新 + Electrobun
```

## 说明

| 路径 | 说明 |
|------|------|
| `src/bun/` | Electrobun 主进程（窗口、RPC、SQLite、启动游戏…） |
| `src/renderer/` | React UI（与原先一致，经 bridge 调后端） |
| `src/shared/rpc.ts` | 前后端 RPC 协议 |
| `src/main/` / `src/preload/` | 旧 Electron 代码，仅作对照，默认不跑 |

数据：

- 数据库优先使用仓库内 `db/gameData.db`
- 封面/上传文件仍用 `%APPDATA%\lopbox`（与旧 Electron 兼容）

详见 [EXPERIMENT.md](./EXPERIMENT.md)。
