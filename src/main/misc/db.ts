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
// 启用外键支持
db.pragma('foreign_keys = ON');

//初始化
db.exec(`
  -- 游戏主表
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT, --游戏主id
    game_name TEXT NOT NULL, -- 游戏名字
    launch_path TEXT NOT NULL UNIQUE, -- UNIQUE约束防止添加重复路径的游戏
    total_play_time INTEGER DEFAULT 0, -- 单位：秒
    last_launch_time INTEGER,          -- UNIX 时间戳 (秒)
    launch_count INTEGER DEFAULT 0, --启动次数
    created_at INTEGER DEFAULT (strftime('%s', 'now')), -- 创建时间
    updated_at INTEGER DEFAULT (strftime('%s', 'now')), -- 更新时间
    disk_size INTEGER DEFAULT 0  -- 磁盘占用大小
  );
  -- 游戏图集表
    CREATE TABLE IF NOT EXISTS game_gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,           -- 图片文件路径
    image_type TEXT NOT NULL,           -- 'banner' 或 'screenshot'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );
`);

console.log(`数据库已在路径 ${dbPath} 初始化`);

/**
 * 添加一个新游戏到数据库
 * @param gameName - 游戏名称
 * @param launchPath - 游戏启动路径
 * @returns 新添加的游戏对象
 */
export function addGame(gameName: string, launchPath: string,disk_size:number) {
  const stmt = db.prepare('INSERT INTO games (game_name, launch_path , disk_size) VALUES (?,?,?)');
  const info = stmt.run(gameName, launchPath ,disk_size);
  return { id: info.lastInsertRowid, gameName, launchPath,disk_size };
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
 * @param elapsedTime - 游戏运行的总秒数
 */
export function updateGameOnClose(id: number, elapsedTime: number) {
  const stmt = db.prepare(`
    UPDATE games
    SET
      total_play_time = total_play_time + ?,
      launch_count = launch_count + 1,
      last_launch_time = strftime('%s', 'now'),
      updated_at = strftime('%s', 'now')
    WHERE id = ?
  `);
  stmt.run(elapsedTime, id);
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
