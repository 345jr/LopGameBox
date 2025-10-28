import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// 获取某游戏成就列表
export const useAchievementList = (gameId: number) => {
  return useQuery({
    queryKey: queryKeys.gameAchievements(String(gameId)),
    queryFn: async () => {
      return await window.api.getGameAchievements(gameId);
    },
    enabled: !!gameId ,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};

// 获取某游戏成就统计
export const useGalleryStats = (gameId: number ) => {
  return useQuery({
    queryKey: queryKeys.achievementStats(String(gameId)),
    queryFn: async () => {
      return await window.api.getAchievementStats(gameId);
    },
    enabled: !!gameId ,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};

//获取图集列表
export const useGalleryList = (gameId: number) => {
  return useQuery({
    queryKey: queryKeys.galleryList(String(gameId)),
    queryFn: async () => {
      return await window.api.getGameSnapshot(gameId);
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
