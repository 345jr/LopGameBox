import { useQuery } from '@tanstack/react-query';
import * as api from './index';
import { queryKeys } from './queryKeys';

/**
 * 检查可用更新的 Hook
 *
 * @param version - 当前应用版本号（字符串）
 * @param enabled - 可选，是否启用该查询
 * @returns React Query 的 query 对象，data 通常包含是否有更新及更新信息
 * @remarks 缓存时间为 1 小时
 */
export const useCheckUpdate = (version: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.update(version),
    queryFn: () => api.checkUpdate(version),
    enabled: !!version && enabled,
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * 获取指定版本的详细信息的 Hook
 *
 * @param version - 要查询的版本号
 * @param enabled - 可选，是否启用该查询
 * @returns React Query 的 query 对象；data 包含版本相关元信息
 */
export const useGetVersionInfo = (version: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.version(version),
    queryFn: () => api.getVersionInfo(version),
    enabled: !!version && enabled,
    staleTime: 60 * 60 * 1000,
  });
};
