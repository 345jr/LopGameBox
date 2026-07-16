# Electrobun 全量迁移

## 为什么 `bun` 找不到？

是的：**没进当前终端的 PATH**。

常见原因：

1. 用 `npm i -g bun` 装到了 `D:\nodejs\npm_global`，但用户 Path 里只有其子目录  
2. 终端是在改 PATH **之前**打开的，需要重开  
3. `C:\Users\Mayn\.bun\bin` 在 Path 里但没有 `bun.exe`

已处理：把 `bun.exe` 复制到 `~\.bun\bin`，并把 `D:\nodejs\npm_global` 写进用户 Path。  
**请新开 PowerShell**，再执行：

```powershell
bun --version
cd D:\lopop\LopGameBox
bun install
bun run dev
```

## 架构

```
Renderer (React)  --RPC call(method,args)-->  Bun main
                 <--messages (timer/rest/screenshot)--
bun:sqlite  +  userData assets HTTP  +  GlobalShortcut / dialogs
```

`window.api.*` 通过 `src/renderer/src/bridge/electrobunApi.ts` 转发，业务组件几乎不用改。

截图：F12 → 主进程 → 前端 `html-to-image` 截页面 → 主进程写 PNG。
