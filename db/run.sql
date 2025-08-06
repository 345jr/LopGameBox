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

-- 添加新字段
ALTER TABLE games ADD COLUMN disk_size INTEGER DEFAULT 0;
ALTER TABLE game_gallery ADD COLUMN relative_path TEXT NOT NULL DEFAULT '';
ALTER TABLE game_gallery ADD COLUMN image_id TEXT NOT NULL AUTOINCREMENT;
ALTER TABLE game_gallery ADD COLUMN image_id TEXT UNIQUE;
-- 添加唯一索引(不能直接添加)
ALTER TABLE game_gallery ADD COLUMN image_id INTEGER;
CREATE UNIQUE INDEX idx_game_gallery_image_id ON game_gallery(image_id);
-- 删除表字段
DELETE FROM game_gallery WHERE game_id = 8 AND image_type = 'snapshot'


-- 创建一个新表
CREATE TABLE IF NOT EXISTS games_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     
      game_name TEXT NOT NULL,
      launch_path TEXT NOT NULL,
      total_play_time INTEGER DEFAULT 0,  -- 单位：秒
      last_launch_time INTEGER,           -- UNIX 时间戳
      launch_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
-- 复制数据
INSERT INTO games_new (id, game_name, launch_path , total_play_time , last_launch_time , launch_count ,created_at,updated_at)
SELECT id, game_name, launch_path , total_play_time , last_launch_time , launch_count ,created_at,updated_at FROM games;
-- 删除旧表
DROP TABLE games;
-- 重命名
ALTER TABLE games_new RENAME TO games;



CREATE TABLE IF NOT EXISTS game_gallery_new_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,           -- 图片文件路径
    image_type TEXT NOT NULL,           -- 'banner' 或 'screenshot'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    relative_path TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

INSERT INTO game_gallery_new_new (id,game_id,image_path,image_type,created_at,relative_path)
SELECT id,game_id,image_path,image_type,created_at,relative_path  FROM game_gallery;

DROP TABLE game_gallery;

ALTER TABLE game_gallery_new_new RENAME TO game_gallery;

UPDATE games SET game_name = '女仆电器街' WHERE id = 13



