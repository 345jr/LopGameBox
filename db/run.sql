-- 插入5条模拟游戏数据
INSERT INTO games (game_name, launch_path, total_play_time, last_launch_time, launch_count)
VALUES 
('超级马里奥', 'C:/games/mario.exe', 3600, strftime('%s', 'now') - 86400, 12),
('塞尔达传说', 'C:/games/zelda.exe', 7200, strftime('%s', 'now') - 43200, 8),
('我的世界', 'C:/games/minecraft.exe', 18000, strftime('%s', 'now') - 3600, 25),
('巫师3', 'D:/games/witcher3.exe', 14400, strftime('%s', 'now') - 7200, 15),
('星露谷物语', 'E:/games/stardew.exe', 10800, strftime('%s', 'now') - 14400, 20);

-- 插入一条新安装但未玩过的游戏
INSERT INTO games (game_name, launch_path, total_play_time, last_launch_time, launch_count)
VALUES ('未玩新游戏', 'F:/games/newgame.exe', 0, NULL, 0);

-- 更新created_at为不同时间（模拟不同时间安装的游戏）
UPDATE games SET created_at = strftime('%s', 'now') - 2592000 WHERE id = 1;  -- 30天前
UPDATE games SET created_at = strftime('%s', 'now') - 1728000 WHERE id = 2;  -- 20天前
UPDATE games SET created_at = strftime('%s', 'now') - 864000 WHERE id = 3;   -- 10天前