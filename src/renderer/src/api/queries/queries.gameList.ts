import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
//游戏列表
export const useGameList = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.gameList(),
    queryFn: async () => {
      return await window.api.getAllGames();
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
//游戏封面图
export const useGameBanner = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.gameBanners(),
    queryFn: async () => {
      return await window.api.getBanners();
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
//搜索游戏
export const useSearchGames = (keyword: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.searchGames(keyword),
    queryFn: async () => {
      return await window.api.searchGames(keyword);
    },
    enabled: !!keyword && enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,

  });
};
//分类游戏
export const useCategoryGames = (category: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.categoryGames(category),
    queryFn: async () => {
      return await window.api.getGamesByCategory(category);
    },
    enabled: !!category && enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
