import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './index';

// ============ Query Keys ============
export const queryKeys = {
  user: (token: string) => ['user', token] as const,
  metadata: (url: string) => ['metadata', url] as const,
  update: (version: string) => ['update', version] as const,
  version: (version: string) => ['version', version] as const,
  gameLinks: (gameId: number) => ['game-links', gameId] as const,
};

// ============ Queries ============

/**
 * 获取用户信息的 Query Hook
 * @param token - JWT Token
 * @param enabled - 是否启用查询（默认需要 token 存在）
 */
export const useGetMe = (token: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.user(token),
    queryFn: () => api.getMe(token),
    enabled: !!token && enabled, // 只有在有 token 且 enabled 为 true 时才执行
    staleTime: 10 * 60 * 1000, // 用户信息缓存 10 分钟
    retry: false, // 认证失败不重试
  });
};

/**
 * 获取网页元数据的 Query Hook
 * @param url - 要获取元数据的 URL
 * @param enabled - 是否启用查询
 */
export const useFetchMetadata = (url: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.metadata(url),
    queryFn: () => api.fetchMetadata(url),
    enabled: !!url && enabled,
    staleTime: 30 * 60 * 1000, // 元数据缓存 30 分钟
  });
};

/**
 * 检查更新的 Query Hook
 * @param version - 当前版本号
 * @param enabled - 是否启用查询
 */
export const useCheckUpdate = (version: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.update(version),
    queryFn: () => api.checkUpdate(version),
    enabled: !!version && enabled,
    staleTime: 60 * 60 * 1000, // 更新信息缓存 1 小时
  });
};

/**
 * 获取版本信息的 Query Hook
 * @param version - 版本号
 * @param enabled - 是否启用查询
 */
export const useGetVersionInfo = (version: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.version(version),
    queryFn: () => api.getVersionInfo(version),
    enabled: !!version && enabled,
    staleTime: 60 * 60 * 1000, // 版本信息缓存 1 小时
  });
};

// ============ Mutations ============

/**
 * 用户登录的 Mutation Hook
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.login(username, password),
    onSuccess: (data) => {
      // 登录成功后，可以预设置用户数据缓存
      if (data.token) {
        queryClient.setQueryData(queryKeys.user(data.token), data);
      }
    },
  });
};

/**
 * 用户注册的 Mutation Hook
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.register(username, password),
    onSuccess: (data) => {
      // 注册成功后，可以预设置用户数据缓存
      if (data.token) {
        queryClient.setQueryData(queryKeys.user(data.token), data);
      }
    },
  });
};

/**
 * 退出登录 - 清除用户相关缓存
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    // 清除所有用户相关的查询缓存
    queryClient.removeQueries({ queryKey: ['user'] });
  };
};

// ============ Game Links Queries & Mutations ============

/**
 * 获取游戏链接列表的 Query Hook
 * @param gameId - 游戏 ID
 * @param enabled - 是否启用查询
 */
export const useGameLinks = (gameId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.gameLinks(gameId),
    queryFn: async () => {
      return await window.api.getGameLinks(gameId);
    },
    enabled: !!gameId && enabled,
    staleTime: 5 * 60 * 1000, // 链接列表缓存 5 分钟
  });
};

/**
 * 添加游戏链接的 Mutation Hook
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
      // 添加成功后，使该游戏的链接列表缓存失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};

/**
 * 更新游戏链接的 Mutation Hook
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
      // 更新成功后，使该游戏的链接列表缓存失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};

/**
 * 删除游戏链接的 Mutation Hook
 */
export const useDeleteGameLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId }: { linkId: number; gameId: number }) => {
      return await window.api.deleteGameLink(linkId);
    },
    onSuccess: (_, variables) => {
      // 删除成功后，使该游戏的链接列表缓存失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.gameLinks(variables.gameId),
      });
    },
  });
};
