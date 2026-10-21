import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { DashboardStats } from '@app-types/stats';

export const useDashboardStats = (): UseQueryResult<DashboardStats, Error> => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await ERDEAxios.get<DashboardStats>('/api/stats');
      return data;
    },
    staleTime: 60 * 1000,
  });
};
