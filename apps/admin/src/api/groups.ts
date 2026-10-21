import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { AdminGroupListResponse, GroupDetail } from '@app-types/groups';

export interface GroupFilters {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const useAdminGroups = (filters: GroupFilters): UseQueryResult<AdminGroupListResponse, Error> => {
  return useQuery({
    queryKey: ['admin-groups', filters],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (filters.q) search.set('q', filters.q);
      if (filters.status) search.set('status', filters.status);
      if (filters.page) search.set('page', String(filters.page));
      if (filters.limit) search.set('limit', String(filters.limit));
      const { data } = await ERDEAxios.get<AdminGroupListResponse>(`/api/group/admin?${search.toString()}`);
      return data;
    },
    placeholderData: (previous) => previous,
  });
};

export const useAdminGroup = (id: string): UseQueryResult<GroupDetail, Error> => {
  return useQuery({
    queryKey: ['admin-group', id],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      const { data } = await ERDEAxios.get<GroupDetail>(`/api/group/${id}`);
      return data;
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await ERDEAxios.delete(`/api/group/${id}`);
      return data;
    },
    onSuccess: (_d, id) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.removeQueries({ queryKey: ['admin-group', id] });
    },
  });
};
