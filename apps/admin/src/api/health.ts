import { useQuery } from '@tanstack/react-query';
import ERDEAxios from './ERDEAxios';

export type ApiHealth = 'online' | 'degraded' | 'offline';

export const API_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL ?? 'http://localhost:4000').host;
  } catch {
    return 'API';
  }
})();

/** Consulta /api/health cada minuto: online, degradado (sin BD) o sin conexión */
export const useApiHealth = () =>
  useQuery<ApiHealth>({
    queryKey: ['api-health'],
    queryFn: async () => {
      try {
        await ERDEAxios.get('/api/health');
        return 'online';
      } catch (error) {
        return (error as { status?: number } | null)?.status ? 'degraded' : 'offline';
      }
    },
    refetchInterval: 60 * 1000,
    retry: false,
  });
