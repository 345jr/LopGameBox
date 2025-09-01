//游戏基础数据
export interface Game {
  id: number;
  game_name: string;
  launch_path: string;
  total_play_time: number;
  last_launch_time: number | null;
  launch_count: number;
  disk_size: number;
  created_at: number;
  updated_at: number;
}
//复制图片数据
export interface GameImage {
  gameId: number;
  imagePath: string;
  type: string;
}
//游戏封面图数据
export interface Banners {
  id: number;
  game_id: number;
  image_path: string;
  image_type: string;
  created_at: number;
  relative_path: string;
}
//游戏快照图片数据
export interface Snapshot {
  id: number;
  game_id: number;
  image_path: string;
  image_type: string;
  created_at: number;
  relative_path: string;
}
//游戏统计数据
export interface GameStatistics {
  gameCount: number;
  gamePlayTime: number;
  launchCount: number;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  normalHours: number;
  fastHours: number;
  afkHours: number;
  infinityHours: number;
}
//游戏周模式时长分布
export interface GameLog {
  play_date: string;
  normalHours: number;
  fastHours: number;
  afkHours: number;
  infinityHours: number;
  totalHours: number;
}
