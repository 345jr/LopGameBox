/**
 * queryKeys 集中定义 React Query 的 key 生成器
 *
 * 使用函数返回的 tuple 可保证 key 的可序列化性与可重用性。
 */
export const queryKeys = {
  /**
   * 游戏链接列表 key
   * @param gameId - 游戏 ID
   */
  gameLinks: (gameId: number) => ['game-links', gameId] as const,
  // 游戏列表
  gameList: () => ['game-list'] as const,
  // 游戏封面图
  gameBanners: () => ['game-banners'] as const,
  // 搜索游戏
  searchGames: (keyword: string) => ['search-games', keyword] as const,
  // 分类游戏
  categoryGames: (category: string) => ['category-games', category] as const,
  // 游戏成就列表
  gameAchievements: (gameId: string) => ['game-achievements', gameId] as const,
  // 游戏成就统计
  achievementStats: (gameId: string) => ['achievement-stats', gameId] as const,
  // 图集列表
  galleryList: (gameId: string, newestFirst: boolean) =>
    ['gallery-list', gameId, newestFirst] as const,
  // 游戏时长
  getGamePlaytime: (gameId: string) => ['game-playtime', gameId] as const,
  // 仪表盘总览
  dashboardStats: () => ['dashboard-stats'] as const,
  // 仪表盘周日志（本周 / 上周）
  dashboardWeekLogs: (isNowWeek: boolean) => ['dashboard-week-logs', isNowWeek] as const,
  // 游戏存档路径
  gameSavePath: (gameId: number) => ['game-save-path', gameId] as const,
  // 存档备份列表
  saveBackups: (gameId: number) => ['save-backups', gameId] as const
}
