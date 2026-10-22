import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type {
  AliasInput,
  AliasListResponse,
  AliasSuggestion,
  CustomAliasRow,
  Tip,
  TipInput,
  TipListResponse,
  TipScreen,
} from '@app-types/catalogs';

const toQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  return search.toString();
};

/* ---------------------------------------------------------------- Alias */

export interface AliasFilters {
  q?: string;
  gender?: string;
  active?: 'true' | 'false' | '';
  page?: number;
  limit?: number;
}

export const useAliasCatalog = (filters: AliasFilters): UseQueryResult<AliasListResponse, Error> =>
  useQuery({
    queryKey: ['alias-catalog', filters],
    queryFn: async () => (await ERDEAxios.get<AliasListResponse>(`/api/alias/admin?${toQuery({ ...filters })}`)).data,
    placeholderData: (previous) => previous,
  });

export const useCustomAliases = (enabled: boolean): UseQueryResult<{ results: CustomAliasRow[] }, Error> =>
  useQuery({
    queryKey: ['alias-custom'],
    enabled,
    queryFn: async () => (await ERDEAxios.get<{ results: CustomAliasRow[] }>('/api/alias/admin/custom?limit=200')).data,
  });

function useAliasInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['alias-catalog'] });
    void queryClient.invalidateQueries({ queryKey: ['alias-custom'] });
  };
}

export const useCreateAlias = () => {
  const invalidate = useAliasInvalidate();
  return useMutation({
    mutationFn: async (input: AliasInput) => (await ERDEAxios.post<AliasSuggestion>('/api/alias/admin', input)).data,
    onSuccess: invalidate,
  });
};

export const useUpdateAlias = () => {
  const invalidate = useAliasInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AliasInput> & { id: string }) =>
      (await ERDEAxios.patch<AliasSuggestion>(`/api/alias/admin/${id}`, input)).data,
    onSuccess: invalidate,
  });
};

export const useDeleteAlias = () => {
  const invalidate = useAliasInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await ERDEAxios.delete(`/api/alias/admin/${id}`)).data,
    onSuccess: invalidate,
  });
};

export const useClearCustomAlias = () => {
  const invalidate = useAliasInvalidate();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) =>
      (await ERDEAxios.delete(`/api/alias/admin/custom/${groupId}/${userId}`)).data,
    onSuccess: invalidate,
  });
};

/* ---------------------------------------------------------------- Tips */

export interface TipFilters {
  q?: string;
  screen?: string;
  active?: 'true' | 'false' | '';
  page?: number;
  limit?: number;
}

export const useTips = (filters: TipFilters): UseQueryResult<TipListResponse, Error> =>
  useQuery({
    queryKey: ['tips', filters],
    queryFn: async () => (await ERDEAxios.get<TipListResponse>(`/api/tips/admin?${toQuery({ ...filters })}`)).data,
    placeholderData: (previous) => previous,
  });

/** Lo mismo que recibe la app para una pantalla (activos + generales, en orden aleatorio) */
export const useTipPreview = (screen: TipScreen): UseQueryResult<{ results: Tip[] }, Error> =>
  useQuery({
    queryKey: ['tips-preview', screen],
    queryFn: async () => (await ERDEAxios.get<{ results: Tip[] }>(`/api/tips?${toQuery({ screen, limit: 50 })}`)).data,
  });

function useTipInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['tips'] });
    void queryClient.invalidateQueries({ queryKey: ['tips-preview'] });
  };
}

export const useCreateTip = () => {
  const invalidate = useTipInvalidate();
  return useMutation({
    mutationFn: async (input: TipInput) => (await ERDEAxios.post<Tip>('/api/tips/admin', input)).data,
    onSuccess: invalidate,
  });
};

export const useUpdateTip = () => {
  const invalidate = useTipInvalidate();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<TipInput> & { id: string }) =>
      (await ERDEAxios.patch<Tip>(`/api/tips/admin/${id}`, input)).data,
    onSuccess: invalidate,
  });
};

export const useDeleteTip = () => {
  const invalidate = useTipInvalidate();
  return useMutation({
    mutationFn: async (id: string) => (await ERDEAxios.delete(`/api/tips/admin/${id}`)).data,
    onSuccess: invalidate,
  });
};
