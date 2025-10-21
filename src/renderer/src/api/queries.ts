import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './index';

// ============ Query Keys ============
export const queryKeys = {
  user: (token: string) => ['user', token] as const,
  metadata: (url: string) => ['metadata', url] as const,
  update: (version: string) => ['update', version] as const,
  version: (version: string) => ['version', version] as const,
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
