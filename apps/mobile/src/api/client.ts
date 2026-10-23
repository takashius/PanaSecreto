import { API_URL } from './config';

/** Error normalizado de la API: siempre trae un mensaje listo para mostrar */
export class ApiError extends Error {
  status: number;
  code?: string;
  /** Errores por campo (p. ej. { email: 'Ya existe…' }) */
  fields: Record<string, string>;
  /** Cuerpo completo de la respuesta (datos extra como blockedMembers) */
  body: unknown;

  constructor(status: number, message: string, code?: string, fields: Record<string, string> = {}, body: unknown = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.body = body;
  }
}

export const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con EntrePanas. Revisa tu conexión e intenta de nuevo.';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Se llama cuando la API responde 401 a una petición autenticada (sesión vencida o cerrada en otro lado) */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type Json = Record<string, unknown>;
const isRecord = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function toApiError(status: number, body: unknown): ApiError {
  if (typeof body === 'string' && body.trim()) return new ApiError(status, body.trim());
  if (isRecord(body)) {
    const code = typeof body.code === 'string' ? body.code : undefined;
    const fields: Record<string, string> = {};
    // Errores de validación del backend: { errors: { campo: ['mensaje'] } } o { campo: 'mensaje' }
    if (isRecord(body.errors)) {
      for (const [k, v] of Object.entries(body.errors)) {
        const first = Array.isArray(v) ? v[0] : v;
        if (typeof first === 'string') fields[k] = first;
      }
    }
    for (const [k, v] of Object.entries(body)) {
      if (!['code', 'message', 'errors', 'error'].includes(k) && typeof v === 'string') fields[k] = v;
    }
    const message =
      (typeof body.message === 'string' && body.message) ||
      (typeof body.error === 'string' && body.error) ||
      Object.values(fields)[0] ||
      defaultMessage(status);
    return new ApiError(status, message, code, fields, body);
  }
  return new ApiError(status, defaultMessage(status));
}

function defaultMessage(status: number): string {
  if (status === 429) return 'Demasiados intentos. Espera un momentico y vuelve a probar.';
  if (status >= 500) return 'Algo falló de nuestro lado. Intenta de nuevo en unos minutos.';
  if (status === 404) return 'No encontramos lo que buscabas.';
  return 'No se pudo completar la solicitud.';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** false = no envía el token (login, registro, recuperación) */
  auth?: boolean;
  /** multipart/form-data (p. ej. deseo con foto); reemplaza a body */
  form?: FormData;
  timeoutMs?: number;
}

export async function api<T>(path: string, { method = 'GET', body, auth = true, form, timeoutMs = 15000 }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const sentToken = auth ? authToken : null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        // Con FormData, fetch pone el Content-Type con el boundary
        ...(body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}),
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
      },
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // respuesta en texto plano
  }

  if (!res.ok) {
    const error = toApiError(res.status, data);
    // Solo si la petición iba con la sesión actual (no una vieja que ya se reemplazó)
    if (res.status === 401 && sentToken && sentToken === authToken) onUnauthorized?.();
    throw error;
  }
  return data as T;
}

/** Mensaje para mostrar de cualquier error */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Ocurrió un error inesperado.';
}
