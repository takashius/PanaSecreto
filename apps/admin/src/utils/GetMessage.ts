type ErrorLike = {
  message?: unknown;
  data?: unknown;
  response?: { data?: unknown };
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Extrae un mensaje legible de cualquier error de la API (axios o rechazo del interceptor) */
export function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (!isRecord(error)) return 'Error de comunicación con el servidor.';

  const e = error as ErrorLike;
  const data = e.response?.data ?? e.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (isRecord(data)) {
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
      const firstValue = Object.values(data)[0];
      if (typeof firstValue === 'string') return firstValue;
    }
  }

  if (typeof e.message === 'string') return e.message;
  return 'Error de comunicación con el servidor.';
}
