export interface Game {
    id: number;
    game_name: string;
    launch_path: string;
    total_play_time: number;
    last_launch_time: number | null;
    launch_count: number;
    created_at:number;
    updated_at:number;
  }
  