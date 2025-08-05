//init.cjs
const db = require('better-sqlite3')('gameData.db')

try {
  // 创建游戏数据表
  db.exec(`
    -- 游戏表
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     
      game_name TEXT NOT NULL,
      launch_path TEXT NOT NULL,
      total_play_time INTEGER DEFAULT 0,  -- 单位：秒
      last_launch_time INTEGER,           -- UNIX 时间戳
      launch_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      disk_size INTEGER DEFAULT 0
    );
    -- 游戏图集表
    CREATE TABLE IF NOT EXISTS game_gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,           -- 图片文件路径
    image_type TEXT NOT NULL,           -- 'banner' 或 'screenshot'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    relative_path TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

  `);

  console.log('数据库初始化成功！');
} catch (err) {
  console.error('数据库初始化失败:', err);
} finally {
  // 关闭数据库连接
  db.close();
}