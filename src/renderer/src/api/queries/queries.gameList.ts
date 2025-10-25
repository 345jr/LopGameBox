import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

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
