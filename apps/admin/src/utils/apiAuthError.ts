export interface ApiErrorReject {
  status: number;
  data?: unknown;
  code?: string;
  toastShown?: boolean;
  rateLimited?: boolean;
}

/** Cuerpo de error estándar de la API */
export interface ApiErrorBody {
  code?: string;
  message?: string;
  error?: string | { code?: string };
  [key: string]: unknown;
}

export function clearLocalSession(): void {
  localStorage.removeItem('Token');
  localStorage.removeItem('user');
}

export function isPublicAuthRequestUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('/user/login') || url.includes('/user/recovery') || url.includes('/user/register');
}

export function getApiErrorBody(responseData: unknown): ApiErrorBody | null {
  return typeof responseData === 'object' && responseData !== null ? (responseData as ApiErrorBody) : null;
}

export function getErrorCode(body: ApiErrorBody | null): string | undefined {
  if (!body) return undefined;
  if (body.code) return body.code;
  return typeof body.error === 'object' ? body.error?.code : undefined;
}

export function getApiUserMessage(data: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  const body = getApiErrorBody(data);
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.error === 'string') return body.error;
  return fallback;
}

export function wasErrorToastShown(error: unknown): boolean {
  return Boolean((error as ApiErrorReject | null)?.toastShown);
}
