import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * 获取某个游戏的链接列表 Hook
 *
 * @param gameId - 游戏 ID
 * @param enabled - 可选，是否启用查询
 * @returns React Query 的 query 对象；data 为链接数组
 */
export const useGameLinks = (gameId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.gameLinks(gameId),
    queryFn: async () => {
      return await window.api.getGameLinks(gameId);
    },
    enabled: !!gameId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 添加游戏链接的 Mutation Hook
 *
 * mutationFn 参数示例：{ gameId: number, metadata: { title, description, favicon, url } }
 * onSuccess 会使对应游戏的链接列表缓存失效以触发重新获取。
 */
export const useAddGameLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      metadata,
    }: {
      gameId: number;
      metadata: {
        title: string;
        description: string;
        favicon: string;
        url: string;
      };
    }) => {
      return await window.api.addGameLink(gameId, metadata);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};

/**
 * 更新单条游戏链接的 Mutation Hook
 *
 * mutationFn 参数示例：{ linkId, title, url, gameId }
 * onSuccess 会让对应游戏的链接缓存失效。
 */
export const useUpdateGameLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      linkId,
      title,
      url,
    }: {
      linkId: number;
      title: string;
      url: string;
      gameId: number;
    }) => {
      return await window.api.updateGameLink(linkId, title, url);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};

/**
 * 删除游戏链接的 Mutation Hook
 *
 * mutationFn 参数示例：{ linkId, gameId }
 * onSuccess 会让对应游戏的链接缓存失效。
 */
export const useDeleteGameLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId }: { linkId: number; gameId: number }) => {
      return await window.api.deleteGameLink(linkId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};
