import { DatabaseManager } from './databaseManager';

export class GameLogsRepository {
  private db = DatabaseManager.getInstance();
  //插入游玩记录
  public insertGameLog(
    gameId: number,
    launchedAt: number,
    endedAt: number,
    launchState: string,
    gameMode: string = '',
  ) {
    // 如果游玩时长小于10秒则不记录
    const play_time = Math.round((endedAt - launchedAt) / 1000);
    if (play_time < 10) return;
    const stmt = this.db.prepare(`
      INSERT INTO game_logs (game_id, play_time, launched_at, ended_at, launch_state, game_mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(gameId, play_time, launchedAt, endedAt, launchState, gameMode);
  }
  //获取今天，本周，本月的游戏时长记录|时间的界限是每天的4点
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
  //获取4种模式下不同的时长分布(总)
  public getGameLogByMode() {
    const stmt = this.db.prepare(`
      SELECT
        (
          SELECT COALESCE(SUM(play_time) / 3600.0, 0)
          FROM game_logs
          WHERE launch_state = 'success' AND game_mode = 'Normal'
        ) AS normalHours,
        (
          SELECT COALESCE(SUM(play_time) / 3600.0, 0)
          FROM game_logs
          WHERE launch_state = 'success' AND game_mode = 'Fast'
        ) AS fastHours,
        (
          SELECT COALESCE(SUM(play_time) / 3600.0, 0)
          FROM game_logs
          WHERE launch_state = 'success' AND game_mode = 'Afk'
        ) AS afkHours,
        (
          SELECT COALESCE(SUM(play_time) / 3600.0, 0)
          FROM game_logs
          WHERE launch_state = 'success' AND game_mode = 'Infinity'
        ) AS infinityHours;
    `);
    return stmt.get();
  }
  //获取本周的游戏模式时长分布  本周（周一到周日）逐日分组统计，每日分列 Normal/Fast/Afk/Infinity 小时数
  public getGameLogByModeThisWeek() {
    const stmt = this.db.prepare(`     
    WITH RECURSIVE
    bounds AS (
        SELECT
            date('now','start of day','localtime', '-' || ((strftime('%w','now','localtime') + 6) % 7) || ' days') AS week_start,
            date('now','start of day','localtime', '-' || ((strftime('%w','now','localtime') + 6) % 7) || ' days', '+6 days') AS week_end
    ),
    dates(day) AS (
        SELECT week_start FROM bounds
        UNION ALL
        SELECT date(day, '+1 day') FROM dates
        WHERE day < (SELECT week_end FROM bounds)
    ),
    agg AS (
        SELECT
            date(launched_at / 1000, 'unixepoch', 'localtime') AS day,
            game_mode,
            SUM(play_time) / 3600.0 AS hours
        FROM game_logs
        WHERE launch_state = 'success'
            AND date(launched_at / 1000, 'unixepoch', 'localtime') BETWEEN (SELECT week_start FROM bounds) AND (SELECT week_end FROM bounds)
        GROUP BY date(launched_at / 1000, 'unixepoch', 'localtime'), game_mode
    )
  SELECT
    d.day AS play_date,
    COALESCE(SUM(CASE WHEN a.game_mode = 'Normal' THEN a.hours END), 0)   AS normalHours,
    COALESCE(SUM(CASE WHEN a.game_mode = 'Fast' THEN a.hours END), 0)     AS fastHours,
    COALESCE(SUM(CASE WHEN a.game_mode = 'Afk' THEN a.hours END), 0)      AS afkHours,
    COALESCE(SUM(CASE WHEN a.game_mode = 'Infinity' THEN a.hours END), 0) AS infinityHours,
    COALESCE(SUM(a.hours), 0)                                             AS totalHours
    FROM dates d
    LEFT JOIN agg a ON a.day = d.day
    GROUP BY d.day
    ORDER BY d.day;
      `);
    return stmt.all();
  }

  // 获取上周（周一到周日）的游戏模式时长分布：逐日分组，分列 Normal/Fast/Afk/Infinity 小时数
  public getGameLogByModeLastWeek() {
    const stmt = this.db.prepare(`
    WITH RECURSIVE
    bounds AS (
        SELECT
            -- 上周周一与周日
            date('now','start of day','localtime', '-' || ((strftime('%w','now','localtime') + 6) % 7) || ' days', '-7 days') AS week_start,
            date('now','start of day','localtime', '-' || ((strftime('%w','now','localtime') + 6) % 7) || ' days', '-7 days', '+6 days') AS week_end
    ),
    dates(day) AS (
        SELECT week_start FROM bounds
        UNION ALL
        SELECT date(day, '+1 day') FROM dates
        WHERE day < (SELECT week_end FROM bounds)
    ),
    agg AS (
        SELECT
            date(launched_at / 1000, 'unixepoch', 'localtime') AS day,
            game_mode,
            SUM(play_time) / 3600.0 AS hours
        FROM game_logs
        WHERE launch_state = 'success'
          AND date(launched_at / 1000, 'unixepoch', 'localtime') BETWEEN (SELECT week_start FROM bounds) AND (SELECT week_end FROM bounds)
        GROUP BY date(launched_at / 1000, 'unixepoch', 'localtime'), game_mode
    )
    SELECT
      d.day AS play_date,
      COALESCE(SUM(CASE WHEN a.game_mode = 'Normal' THEN a.hours END), 0)   AS normalHours,
      COALESCE(SUM(CASE WHEN a.game_mode = 'Fast' THEN a.hours END), 0)     AS fastHours,
      COALESCE(SUM(CASE WHEN a.game_mode = 'Afk' THEN a.hours END), 0)      AS afkHours,
      COALESCE(SUM(CASE WHEN a.game_mode = 'Infinity' THEN a.hours END), 0) AS infinityHours,
      COALESCE(SUM(a.hours), 0)                                             AS totalHours
    FROM dates d
    LEFT JOIN agg a ON a.day = d.day
    GROUP BY d.day
    ORDER BY d.day;
    `);
    return stmt.all();
  }
}
