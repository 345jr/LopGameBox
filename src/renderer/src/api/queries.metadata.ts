import { useQuery } from '@tanstack/react-query';
import * as api from './index';
import { queryKeys } from './queryKeys';

/**
 * 获取网页元数据的 Query Hook
 *
 * @param url - 需要抓取元数据的网页地址
 * @param enabled - 可选，是否启用该查询（默认基于 url 自动决定）
 * @returns React Query 的 query 对象；data 字段通常包含 title/description/favicon 等
 * @remarks
 * - 元数据缓存 30 分钟以减少重复抓取
 */
export const useFetchMetadata = (url: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.metadata(url),
    queryFn: () => api.fetchMetadata(url),
    enabled: !!url && enabled,
    staleTime: 30 * 60 * 1000,
  });
};
