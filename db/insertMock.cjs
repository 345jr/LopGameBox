// insert-mock-data.js
const Database = require('better-sqlite3');
const path = require('path');

// 连接到数据库（确保先运行 init.js）
const db = new Database(path.join(__dirname, 'gameData.db'));

// 模拟游戏数据
const mockGames = [
  {
    game_id: 'elden-ring-001',
    game_name: '艾尔登法环',
    launch_path: 'steam://rungameid/1245620',
    total_play_time: 85600,  // 约 23.8 小时
    last_launch_time: Math.floor(Date.now() / 1000) - 86400, // 1天前
    launch_count: 15
  },
  {
    game_id: 'stardew-valley-002',
    game_name: '星露谷物语',
    launch_path: 'D:\\Games\\Stardew Valley\\StardewValley.exe',
    total_play_time: 324000, // 90 小时
    last_launch_time: Math.floor(Date.now() / 1000) - 3600, // 1小时前
    launch_count: 42
  },
  {
    game_id: 'minecraft-003',
    game_name: '我的世界',
    launch_path: 'C:\\Program Files\\Minecraft\\Launcher.exe',
    total_play_time: 0, // 新游戏还未玩过
    last_launch_time: null,
    launch_count: 0
  },
  {
    game_id: 'cyberpunk-004',
    game_name: '赛博朋克2077',
    launch_path: 'D:\\Games\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe',
    total_play_time: 187200, // 52 小时
    last_launch_time: Math.floor(Date.now() / 1000) - 259200, // 3天前
    launch_count: 8
  },
  {
    game_id: 'hades-005',
    game_name: '黑帝斯',
    launch_path: 'steam://rungameid/1145360',
    total_play_time: 72000, // 20 小时
    last_launch_time: Math.floor(Date.now() / 1000) - 172800, // 2天前
    launch_count: 22
  }
];

// 插入数据
try {
  const insert = db.prepare(`
    INSERT INTO games (
      game_id, game_name, launch_path, 
      total_play_time, last_launch_time, launch_count
    ) VALUES (
      @game_id, @game_name, @launch_path,
      @total_play_time, @last_launch_time, @launch_count
    )
  `);

  const insertMany = db.transaction((games) => {
    for (const game of games) insert.run(game);
  });

  insertMany(mockGames);
  console.log('成功插入 5 条模拟游戏数据！');

} catch (err) {
  console.error('插入数据时出错:', err);
} finally {
  db.close();
}