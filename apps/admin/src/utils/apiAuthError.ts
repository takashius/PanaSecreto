export interface ApiErrorReject {
  status: number;
  data?: unknown;
  code?: string;
  toastShown?: boolean;
  rateLimited?: boolean;
}

export function clearLocalSession(): void {
  localStorage.removeItem('Token');
  localStorage.removeItem('user');
}

export function isPublicAuthRequestUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/user/login') ||
    url.includes('/user/recovery') ||
    url.includes('/user/register')
  );
}

export function getApiErrorBody(responseData: unknown): any {
  if (typeof responseData === 'object' && responseData !== null) {
    return responseData;
  }
  return null;
}

export function getErrorCode(body: any): string | undefined {
  if (!body) return undefined;
  return body.code || body.error?.code;
}

export function getApiUserMessage(data: any, fallback = 'Ocurrió un error inesperado'): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.error && typeof data.error === 'string') return data.error;
  return fallback;
}

export function wasErrorToastShown(error: any): boolean {
  return Boolean(error?.toastShown);
}
