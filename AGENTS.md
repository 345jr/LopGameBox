# LopBox（LopGameBox）

本地桌面游戏库：启动游戏、时长/休息提醒、图集、成就、存档备份、统计看板。

## 技术栈

- **壳**：Electron 39 + electron-vite 5
- **UI**：React 19、React Router 7（hash）、Tailwind 4
- **状态**：TanStack Query（IPC/服务端数据）、Zustand（UI/会话，部分 persist）
- **数据**：better-sqlite3（手写 SQL）；`kysely-codegen` 仅生成类型（`npm run gen:db`）
- **打包**：electron-builder → 产品名 **LopBox**（`com.lopbox.app`）

## 目录

```
src/main/
  index.ts         # 启动入口（薄）
  app/             # 窗口、lop 协议
  ipc/             # 按域注册 IPC（gamesSession/games/gallery/saves…）
  services/        # GameService、GameSession、Screenshot、各 Repository
  util/            # 路径、磁盘大小、文件操作
src/preload/       # contextBridge → window.api
src/renderer/src/  # React 前端
  api/             # React Query keys 与 hooks
  components/      # 页面与组件
  store/           # Zustand
db/gameData.db     # 仅开发库（生产用 userData）
```

## 进程边界

| 层 | 职责 |
|----|------|
| Renderer | 只做 UI；调用 `window.api.*`，禁止直接用 Node/fs/db |
| Preload | 暴露 IPC；与 main 的 handler 保持一一对应 |
| Main | 全部 IPC、spawn 游戏、计时/休息、截图、SQLite、userData 文件 |

自定义协议 `lop://` 从 `app.getPath('userData')` 提供用户资源。

## 常用命令

```bash
npm run dev              # 开发
npm run typecheck        # node + web 类型检查
npm run lint / format
npm run gen:db           # 从 SQLite 重生成 src/main/types/database.d.ts
npm run build:win        # Windows 生产构建
```

## 约定

- **新功能路径**：Repository SQL → `GameService` 方法 → `src/main/ipc/*.ipc.ts` 注册 handler → preload 的 `window.api` → React Query hook + `queryKeys` → UI。
- **数据库路径**：开发 `db/gameData.db`；打包后 `userData/gameData.db`。表结构与简易迁移在 `DatabaseManager.initSchema()`。
- **可写文件**（图片、备份、截图）：一律写 `userData`，不要写安装目录或 `src`。
- **IPC 命名**：`db:*`、`op:*`、`dialog:*`、`shell:*`、`window:*`、`screenshot:*`；推送事件用 `timer:*`、`screenshot:success` 等。
- **类型**：行类型在 `src/main/types/rows.ts`；表结构在生成的 `database.d.ts`；前端游戏类型在 `src/renderer/src/types/`。
- **别名**：`@renderer` → `src/renderer/src`。
- 改动保持小而准；未要求时不要扩 scope（文档、重构、加依赖）。
- 沿用现有风格：中文注释/日志可以，标识符用英文。

## 领域要点

- **游戏**：`launch_path` 唯一；分类 `all` | `playing` | `archived`。
- **模式**：`Normal`（40 分钟休息）、`Fast`（20 分钟）、`Afk`、`Infinity`（及 `Test`）；计时/休息状态机在主进程全局变量中。
- **相关表**：`game_gallery`、`game_logs`、`game_versions`、`game_achievements`、`game_links`、`game_save_paths`、`game_save_backups`（对 `games` 外键级联删除）。
- **路由**：`/`、`/gallery/:gameId`、`/dashboard`、`/setting`、`/setting/update`。

## 注意

- 主进程入口 `main/index.ts` 只负责组装；IPC 按域放在 `main/ipc/`，计时/子进程在 `GameSession`。
- preload 与 main 必须成对；漏一侧功能会静默失效。
- Kysely **不是**运行时查询层，除非明确要迁移，不要引入 Kysely 查询。
- 打包排除 `db/`、`screenshots/`、`saveBackups/`；运行时数据在 `userData` 创建。
- 同时只允许一个游戏子进程（`childProcess` 守卫）。

## 勿随意动

- 不要提交 `node_modules/`、`out/`、本地库文件、截图。
- 未明确要求时不要 force-push，也不要改发布/自动更新 URL。
