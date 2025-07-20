//init.cjs
const db = require('better-sqlite3')('gameData.db')

try {
  // 创建游戏数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     
      game_name TEXT NOT NULL,
      launch_path TEXT NOT NULL,
      total_play_time INTEGER DEFAULT 0,  -- 单位：秒
      last_launch_time INTEGER,           -- UNIX 时间戳
      launch_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  console.log('数据库初始化成功！表 "games" 已创建或已存在');
} catch (err) {
  console.error('数据库初始化失败:', err);
} finally {
  // 关闭数据库连接
  db.close();
}