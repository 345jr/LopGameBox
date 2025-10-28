/**
 * queryKeys 集中定义 React Query 的 key 生成器
 *
 * 使用函数返回的 tuple 可保证 key 的可序列化性与可重用性。
 */
export const queryKeys = {
  /**
   * 用户相关缓存 key
   * @param token - JWT token，可用于把不同用户的数据区分开
   */
  user: (token: string) => ['user', token] as const,

  /**
   * 网页元数据 key
   * @param url - 目标 URL
   */
  metadata: (url: string) => ['metadata', url] as const,

  /**
   * 检查更新的 key
   * @param version - 当前版本号
   */
  update: (version: string) => ['update', version] as const,

  /**
   * 版本信息 key
   * @param version - 版本号
   */
  version: (version: string) => ['version', version] as const,

  /**
   * 游戏链接列表 key
   * @param gameId - 游戏 ID
   */
  gameLinks: (gameId: number) => ['game-links', gameId] as const,
  //游戏列表
  gameList: () => ['game-list'] as const,
  //游戏封面图
  gameBanners: () => ['game-banners'] as const,  
  //搜索游戏
  searchGames: (keyword: string) => ['search-games', keyword] as const,
  //分类游戏
  categoryGames: (category: string) => ['category-games', category] as const,
  // 游戏成就列表
  gameAchievements: (gameId: string) => ['game-achievements', gameId] as const,
  // 游戏成就统计
  achievementStats: (gameId: string) => ['achievement-stats', gameId] as const,
  // 图集列表
  galleryList: (gameId: string) => ['gallery-list', gameId] as const,
};
