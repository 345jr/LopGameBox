import { DatabaseManager } from './databaseManager';

export class GameLogsRepository {
  private db = DatabaseManager.getInstance();
  //插入游玩记录(游戏关闭时)
  public insertGameLog(
    gameId: number,
    launchedAt: number,
    endedAt: number,
    launchState: string,
    gameMode: string = ''
  ) {
    const stmt = this.db.prepare(`
      INSERT INTO game_logs (game_id, play_time, launched_at, ended_at, launch_state, game_mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const play_time = Math.round((endedAt - launchedAt) / 1000);
    stmt.run(gameId, play_time, launchedAt, endedAt, launchState, gameMode);
  }
  //获取今天，本周，本月的游戏时长记录
  public getGameLogDayWeekMonth() {
    const stmt = this.db.prepare(`
        SELECT
      (
        SELECT COALESCE(SUM(play_time) / 3600.0, 0)
        FROM game_logs
        WHERE launch_state = 'success'
            AND launched_at / 1000 >= CAST(strftime('%s', 'now', 'start of day', 'localtime') AS INTEGER)
            AND launched_at / 1000 < CAST(strftime('%s', 'now', 'start of day', '+1 day', 'localtime') AS INTEGER)
      ) AS todayHours,
      (
        SELECT COALESCE(SUM(play_time) / 3600.0, 0)
        FROM game_logs
        WHERE launch_state = 'success'
            AND launched_at / 1000 >= CAST(strftime('%s', 'now', 'start of day', '-' || ((strftime('%w', 'now', 'localtime') + 6) % 7) || ' days', 'localtime') AS INTEGER)            
            AND launched_at / 1000 < CAST(strftime('%s', 'now', 'start of day', '-' || ((strftime('%w', 'now', 'localtime') + 6) % 7) || ' days', '+7 days', 'localtime') AS INTEGER)
      ) AS weekHours,
      (
        SELECT COALESCE(SUM(play_time) / 3600.0, 0)
        FROM game_logs
        WHERE launch_state = 'success'
            AND launched_at / 1000 >= CAST(strftime('%s', 'now', 'start of month', 'localtime') AS INTEGER)
            AND launched_at / 1000 < CAST(strftime('%s', 'now', 'start of month', '+1 month', 'localtime') AS INTEGER)
      ) AS monthHours;
    `);
    return stmt.get();
  }
}
