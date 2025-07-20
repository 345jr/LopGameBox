import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
let dbPath:string
if (app.isPackaged) {
  // 生产环境：获取可执行文件所在目录，并拼接数据库文件名
  dbPath = path.join(path.dirname(app.getPath('exe')), 'db/gameData.db');
} else {
  // 开发环境：使用项目根目录
  dbPath = path.join(process.cwd(), 'db/gameData.db');
}
const db = new Database(dbPath);
// 在应用启动时，执行一次建表操作。
// IF NOT EXISTS 确保了表只在不存在时被创建。
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    launch_path TEXT NOT NULL UNIQUE, -- UNIQUE约束防止添加重复路径的游戏
    total_play_time INTEGER DEFAULT 0, -- 单位：秒
    last_launch_time INTEGER,          -- UNIX 时间戳 (秒)
    launch_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

console.log(`数据库已在路径 ${dbPath} 初始化`);

/**
 * 添加一个新游戏到数据库
 * @param gameName - 游戏名称
 * @param launchPath - 游戏启动路径
 * @returns 新添加的游戏对象
 */
export function addGame(gameName: string, launchPath: string) {
  const stmt = db.prepare('INSERT INTO games (game_name, launch_path) VALUES (?, ?)');
  const info = stmt.run(gameName, launchPath);
  return { id: info.lastInsertRowid, gameName, launchPath };
}

/**
 * 获取数据库中所有的游戏
 * @returns 游戏对象数组
 */
export function getAllGames() {
  const stmt = db.prepare('SELECT * FROM games ORDER BY last_launch_time DESC, game_name ASC');
  return stmt.all();
}

/**
 * 根据启动路径查找游戏，用于防止重复添加
 * @param launchPath - 游戏启动路径
 * @returns 找到的游戏对象或 undefined
 */
export function getGameByPath(launchPath: string) {
    const stmt = db.prepare('SELECT * FROM games WHERE launch_path = ?');
    return stmt.get(launchPath);
}

/**
 * 当一个游戏运行结束后，更新它的统计数据
 * @param id - 游戏ID
 * @param elapsedTimeInMs - 游戏运行的总毫秒数
 */
export function updateGameOnClose(id: number, elapsedTimeInMs: number) {
  const elapsedSeconds = Math.round(elapsedTimeInMs / 1000);
  const stmt = db.prepare(`
    UPDATE games
    SET
      total_play_time = total_play_time + ?,
      launch_count = launch_count + 1,
      last_launch_time = strftime('%s', 'now'),
      updated_at = strftime('%s', 'now')
    WHERE id = ?
  `);
  stmt.run(elapsedSeconds, id);
}

/**
 * 从数据库中删除一个游戏
 * @param id - 要删除的游戏的ID
 * @returns 返回包含更改行数的对象
 */
export function deleteGame(id: number) {
  const stmt = db.prepare('DELETE FROM games WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes }; // 返回被删除的行数
}

// 确保在应用退出前关闭数据库连接
app.on('before-quit', () => {
  if (db.open) {
    db.close();
    console.log('数据库连接已关闭。');
  }
});
