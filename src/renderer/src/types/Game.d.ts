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
export interface GameImage {
  gameId: number;
  imagePath: string;
  type: string;
}
export interface Banners {
  id: number;
  game_id: number;
  image_path: string;
  image_type: string;
  created_at: number;
}
