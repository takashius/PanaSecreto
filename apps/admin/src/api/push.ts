import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';
import type {
  PushAudience,
  PushAudiencePreview,
  PushCampaign,
  PushCampaignListResponse,
  PushSendInput,
  PushStats,
} from '@app-types/push';

export const usePushStats = (): UseQueryResult<PushStats, Error> =>
  useQuery({
    queryKey: ['push-stats'],
    queryFn: async () => (await ERDEAxios.get<PushStats>('/api/push/admin/stats')).data,
  });

/** Cuántos recibirían el aviso (solo se pide cuando los destinatarios están completos) */
export const usePushAudience = (
  audience: PushAudience,
  groupId: string | undefined,
  userIds: string[]
): UseQueryResult<PushAudiencePreview, Error> => {
  const ready = audience === 'all' || (audience === 'group' && !!groupId) || (audience === 'users' && userIds.length > 0);
  return useQuery({
    queryKey: ['push-audience', audience, groupId ?? '', [...userIds].sort().join(',')],
    enabled: ready,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const search = new URLSearchParams({ audience });
      if (audience === 'group' && groupId) search.set('groupId', groupId);
      if (audience === 'users') search.set('userIds', userIds.join(','));
      return (await ERDEAxios.get<PushAudiencePreview>(`/api/push/admin/audience?${search.toString()}`)).data;
    },
  });
};

export const usePushCampaigns = (page: number, limit: number): UseQueryResult<PushCampaignListResponse, Error> =>
  useQuery({
    queryKey: ['push-campaigns', page, limit],
    placeholderData: keepPreviousData,
    queryFn: async () => (await ERDEAxios.get<PushCampaignListResponse>(`/api/push/admin/campaigns?page=${page}&limit=${limit}`)).data,
  });

export const useSendPush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PushSendInput) => (await ERDEAxios.post<PushCampaign>('/api/push/admin/send', input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['push-campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['push-stats'] });
    },
  });
};
