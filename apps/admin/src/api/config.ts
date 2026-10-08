import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { SystemConfigData } from '../types/config';

export const useSystemConfig = (): UseQueryResult<SystemConfigData, Error> => {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data } = await ERDEAxios.get<SystemConfigData>('/api/config');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Partial<SystemConfigData>) => {
      const { data } = await ERDEAxios.put<SystemConfigData>('/api/config', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['system-config'], data);
      void queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
  });
};
