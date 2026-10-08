import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type { CreateUserRequest, ManagedUser, UserListResponse } from '@app-types/users';

export interface UserFilters {
  active?: 'true' | 'false' | '';
  role?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const useUsers = (filters: UserFilters): UseQueryResult<UserListResponse, Error> => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (filters.active) search.set('active', filters.active);
      if (filters.role) search.set('role', filters.role);
      if (filters.q) search.set('q', filters.q);
      if (filters.page) search.set('page', String(filters.page));
      if (filters.limit) search.set('limit', String(filters.limit));
      const { data } = await ERDEAxios.get<UserListResponse>(`/user/admin?${search.toString()}`);
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useUser = (id: string): UseQueryResult<ManagedUser, Error> => {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await ERDEAxios.get<ManagedUser>(`/user/admin/${id}`);
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserRequest) => {
      const { data } = await ERDEAxios.post<ManagedUser>('/user/admin', payload);
      return data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ManagedUser> }) => {
      const { data } = await ERDEAxios.patch<ManagedUser>(`/user/admin/${id}`, payload);
      return data;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
};

export const useSetUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await ERDEAxios.patch(`/user/admin/${id}/role`, { role });
      return data;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
};

export const useSetUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data } = await ERDEAxios.patch(`/user/admin/${id}/active`, { active });
      return data;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
};

export const useSetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const { data } = await ERDEAxios.patch(`/user/admin/${id}/password`, { password });
      return data;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
};

export const useSetUserForcePasswordChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      forcePasswordChangeOnNextLogin,
    }: {
      id: string;
      forcePasswordChangeOnNextLogin: boolean;
    }) => {
      const { data } = await ERDEAxios.patch(`/user/admin/${id}/force-password-change`, {
        forcePasswordChangeOnNextLogin,
      });
      return data;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
};
