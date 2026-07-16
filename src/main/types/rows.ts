/**
 * better-sqlite3 查询结果的运行时行类型（与 database.d.ts 表结构对应，去掉 Generated 包装）
 */

export interface GameRow {
  id: number
  game_name: string
  launch_path: string
  total_play_time: number
  last_launch_time: number | null
  launch_count: number
  created_at: number
  updated_at: number
  disk_size: number
  game_version: string
  category: string | null
}

export interface GameVersionRow {
  id: number
  game_id: number
  version: string
  summary: string | null
  file_size: number | null
  created_at: number
  updated_at: number
}

export interface GameSavePathRow {
  id: number
  game_id: number
  save_path: string
  file_size: number
  created_at: number
  updated_at: number
}

export interface GameSaveBackupRow {
  id: number
  game_id: number
  backup_name: string
  backup_path: string
  file_size: number
  created_at: number
}

export interface GameLinkRow {
  id: number
  game_id: number
  url: string
  title: string | null
  description: string | null
  icon: string | null
  created_at: number
  updated_at: number
}

export interface GameGalleryRow {
  id: number
  game_id: number
  image_path: string
  image_type: string
  relative_path: string
  alt: string | null
  created_at: number
}

export interface GameAchievementRow {
  id: number
  game_id: number
  achievement_name: string
  achievement_type: string
  description: string | null
  is_completed: number
  created_at: number
  completed_at: number | null
}

export interface GameLogDayHours {
  todayHours: number
  weekHours: number
  monthHours: number
}

export interface GameLogModeHours {
  normalHours: number
  fastHours: number
  afkHours: number
  infinityHours: number
}

export interface GameLogDailyModeRow {
  play_date: string
  normalHours: number
  fastHours: number
  afkHours: number
  infinityHours: number
  totalHours: number
}

export interface DropFilePayload {
  name?: string
  type?: string
  size?: number
  path?: string
  buffer?: ArrayBuffer | Uint8Array | number[]
}

export interface TempDropPayload {
  files?: DropFilePayload[]
}
