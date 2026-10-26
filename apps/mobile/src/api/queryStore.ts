import { useEffect, useSyncExternalStore } from 'react';
import { ApiError } from './client';

/**
 * Caché mínima de consultas a la API (sin dependencias):
 * - las pantallas muestran al instante lo último que se cargó y lo refrescan por detrás,
 * - varias pantallas pueden leer la misma consulta (p. ej. los no leídos del chat),
 * - se limpia al cerrar sesión.
 */
export interface QueryEntry<T = unknown> {
  data?: T;
  error: ApiError | null;
  fetching: boolean;
  updatedAt?: number;
}

const EMPTY: QueryEntry = { error: null, fetching: false };
const entries = new Map<string, QueryEntry>();
const inflight = new Map<string, Promise<void>>();
const subscribers = new Set<() => void>();

function setEntry(key: string, patch: Partial<QueryEntry>) {
  entries.set(key, { ...(entries.get(key) ?? EMPTY), ...patch });
  subscribers.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
}

/** Ejecuta (o reutiliza si ya está en curso) la consulta y guarda el resultado */
export function fetchQuery<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  const running = inflight.get(key);
  if (running) return running;
  setEntry(key, { fetching: true });
  const task = fetcher()
    .then((data) => setEntry(key, { data, error: null, fetching: false, updatedAt: Date.now() }))
    .catch((error: unknown) => {
      const apiError = error instanceof ApiError ? error : new ApiError(0, 'Ocurrió un error inesperado.');
      setEntry(key, { error: apiError, fetching: false });
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, task);
  return task;
}

/** Actualiza a mano los datos guardados (p. ej. tras crear o salir de un grupo) */
export function setQueryData<T>(key: string, updater: (prev: T | undefined) => T): void {
  setEntry(key, { data: updater(entries.get(key)?.data as T | undefined), updatedAt: Date.now() });
}

/** true si alguna pantalla ya pidió esta consulta (sirve para refrescar solo lo que se usa) */
export function hasQuery(key: string): boolean {
  return entries.has(key);
}

/** Marca consultas para recargarse la próxima vez que se usen (por prefijo de clave) */
export function invalidateQueries(prefix: string): void {
  for (const key of entries.keys()) if (key.startsWith(prefix)) setEntry(key, { updatedAt: 0 });
}

export function clearQueries(): void {
  entries.clear();
  inflight.clear();
  subscribers.forEach((notify) => notify());
}

interface Options {
  /** No vuelve a pedir si lo guardado tiene menos de estos milisegundos */
  staleMs?: number;
  enabled?: boolean;
}

export function useApiQuery<T>(key: string, fetcher: () => Promise<T>, { staleMs = 0, enabled = true }: Options = {}) {
  const entry = useSyncExternalStore(subscribe, () => (entries.get(key) ?? EMPTY) as QueryEntry<T>);

  useEffect(() => {
    if (!enabled) return;
    const current = entries.get(key);
    const fresh = current?.updatedAt && Date.now() - current.updatedAt < staleMs;
    if (!fresh) void fetchQuery(key, fetcher);
  }, [key, fetcher, staleMs, enabled]);

  return {
    data: entry.data,
    error: entry.error,
    /** Primera carga (aún no hay datos) */
    loading: entry.data === undefined && entry.error === null,
    /** Hay una petición en curso (incluye recargas con datos ya visibles) */
    fetching: entry.fetching,
    refetch: () => fetchQuery(key, fetcher),
  };
}
