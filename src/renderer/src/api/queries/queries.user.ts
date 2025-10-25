import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../originAPI/index';
import { queryKeys } from '../queryKeys';

/**
 * 获取当前登录用户信息的 Hook
 *
 * @param token - JWT token，用于鉴权请求
 * @param enabled - 可选，是否启用查询，默认基于 token 自动决定
 * @returns React Query 的 query 对象（包含 data, status, error 等）
 * @remarks
 * - staleTime 设置为 10 分钟
 * - retry 被禁用以避免认证失败时自动重试
 */
export const useGetMe = (token: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.user(token),
    queryFn: () => api.getMe(token),
    enabled: !!token && enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

/**
 * 登录 Mutation Hook
 *
 * @returns React Query 的 mutation 对象，用来触发登录请求。
 * onSuccess 会在接收到 token 时把用户数据写入缓存（key: queryKeys.user(token)）。
 * @example
 * const login = useLogin();
 * login.mutate({ username: 'u', password: 'p' });
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.login(username, password),
    onSuccess: (data) => {
      if (data.token) {
        queryClient.setQueryData(queryKeys.user(data.token), data);
      }
    },
  });
};

/**
 * 注册 Mutation Hook
 *
 * @returns React Query 的 mutation 对象，用来触发注册请求。
 * onSuccess 会在接收到 token 时把用户数据写入缓存（key: queryKeys.user(token)）。
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.register(username, password),
    onSuccess: (data) => {
      if (data.token) {
        queryClient.setQueryData(queryKeys.user(data.token), data);
      }
    },
  });
};

/**
 * 退出登录 helper
 *
 * 返回一个函数用于清除用户相关缓存（例如登出时使用）。
 *
 * @example
 * const logout = useLogout();
 * logout();
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: ['user'] });
  };
};
