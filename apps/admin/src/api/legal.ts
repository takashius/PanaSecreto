import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';

export type LegalDocKey = 'terms' | 'privacy';

export interface LegalSection {
  id: string;
  title: string;
  body: string;
}

export interface PublicLegalDoc {
  key: LegalDocKey;
  title: string;
  version: number;
  updatedAt?: string;
  lang: 'es' | 'en';
  markdown: string;
  sections: LegalSection[];
}

export interface AdminLegalDoc {
  key: LegalDocKey;
  version: number;
  updatedAt?: string;
  body: {
    es: string;
    en: string;
  };
}

export const usePublicLegal = (key: LegalDocKey, lang: string): UseQueryResult<PublicLegalDoc, Error> => {
  const normalized = lang.startsWith('en') ? 'en' : 'es';
  return useQuery({
    queryKey: ['publicLegal', key, normalized],
    queryFn: async () => {
      const { data } = await ERDEAxios.get<PublicLegalDoc>(`/api/legal/${key}`, {
        params: { lang: normalized },
      });
      return data;
    },
  });
};

export const useAdminLegal = (key: LegalDocKey): UseQueryResult<AdminLegalDoc, Error> => {
  return useQuery({
    queryKey: ['adminLegal', key],
    queryFn: async () => {
      const { data } = await ERDEAxios.get<AdminLegalDoc>(`/api/legal/admin/${key}`);
      return data;
    },
  });
};

export const usePublishLegal = (key: LegalDocKey) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { es: string; en: string }) => {
      const { data } = await ERDEAxios.patch<AdminLegalDoc>(`/api/legal/admin/${key}`, { body });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['adminLegal', key], data);
      void queryClient.invalidateQueries({ queryKey: ['publicLegal', key] });
    },
  });
};

export const submitServiceCancellation = async (payload: Record<string, unknown>) => {
  const { data } = await ERDEAxios.post<{ ok: boolean }>('/api/legal/service-cancellation', payload);
  return data;
};
