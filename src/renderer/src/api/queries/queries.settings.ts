import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'

export const useDefaultBanners = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.defaultBanners(),
    queryFn: async () => window.api.getDefaultBanners(),
    enabled,
    staleTime: 30_000,
    retry: false
  })
}

export const useAppBackgrounds = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.appBackgrounds(),
    queryFn: async () => window.api.getAppBackgrounds(),
    enabled,
    staleTime: 30_000,
    retry: false
  })
}
