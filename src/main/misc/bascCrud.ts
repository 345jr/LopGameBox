import type { Database } from 'better-sqlite3';

/**
 * 添加一个新游戏到数据库
 * @param gameName - 游戏名称
 * @param launchPath - 游戏启动路径
 * @returns 新添加的游戏对象
 */
export function addGame(db:Database,gameName: string, launchPath: string,disk_size:number) {
  const stmt = db.prepare('INSERT INTO games (game_name, launch_path , disk_size) VALUES (?,?,?)');
  const info = stmt.run(gameName, launchPath ,disk_size);
  return { id: info.lastInsertRowid, gameName, launchPath,disk_size };
}

/**
 * 获取数据库中所有的游戏
 * @returns 游戏对象数组
 */
export function getAllGames(db:Database) {
  const stmt = db.prepare('SELECT * FROM games ORDER BY last_launch_time DESC, game_name ASC');
  return stmt.all();
}

/**
 * 根据启动路径查找游戏，用于防止重复添加
 * @param launchPath - 游戏启动路径
 * @returns 找到的游戏对象或 undefined
 */
export function getGameByPath(db:Database,launchPath: string) {
    const stmt = db.prepare('SELECT * FROM games WHERE launch_path = ?');
    return stmt.get(launchPath);
}

/**
 * 当一个游戏运行结束后，更新它的统计数据
 * @param id - 游戏ID
 * @param elapsedTime - 游戏运行的总秒数
 */
export function updateGameOnClose(db:Database,id: number, elapsedTime: number) {
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
export function deleteGame(db:Database,id: number) {
  const stmt = db.prepare('DELETE FROM games WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes }; // 返回被删除的行数
}

