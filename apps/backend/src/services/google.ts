import { createPublicKey, type JsonWebKey, type KeyObject } from 'crypto';
import { verify } from 'jsonwebtoken';
import config from '../config/commons';

/**
 * Inicio de sesión con Google sin dependencias extra:
 *  - intercambia el código OAuth por tokens (flujo por navegador),
 *  - verifica la firma del ID token con las claves públicas de Google (JWKS, en caché).
 */

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  name?: string;
  picture?: string;
}

export class GoogleAuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

let jwksCache: { keys: Map<string, KeyObject>; expiresAt: number } | null = null;

async function getKey(kid: string): Promise<KeyObject> {
  const now = Date.now();
  if (!jwksCache || jwksCache.expiresAt < now || !jwksCache.keys.has(kid)) {
    const res = await fetch(config.google.jwksUrl);
    if (!res.ok) throw new GoogleAuthError('GOOGLE_UNAVAILABLE', 'No se pudo contactar a Google. Intenta de nuevo.');
    const body = (await res.json()) as { keys: Array<JsonWebKey & { kid: string }> };
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
    jwksCache = {
      keys: new Map(body.keys.map((k) => [k.kid, createPublicKey({ key: k, format: 'jwk' })])),
      expiresAt: now + Math.min(maxAge, 6 * 3600) * 1000,
    };
  }
  const key = jwksCache.keys.get(kid);
  if (!key) throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'El inicio de sesión con Google no es válido.');
  return key;
}

/** Solo para pruebas: olvida las claves en caché */
export function resetGoogleKeyCache(): void {
  jwksCache = null;
}

export const allowedGoogleAudiences = () =>
  [config.google.webClientId, ...config.google.extraClientIds].filter(Boolean);

export const isGoogleConfigured = () => Boolean(config.google.webClientId && config.google.webClientSecret);

/** Verifica un ID token de Google y devuelve el perfil */
export async function verifyGoogleIdToken(idToken: string, nonce?: string): Promise<GoogleProfile> {
  const audiences = allowedGoogleAudiences();
  if (audiences.length === 0) {
    throw new GoogleAuthError('GOOGLE_NOT_CONFIGURED', 'El inicio de sesión con Google no está configurado.');
  }
  const [rawHeader] = idToken.split('.');
  let kid: string | undefined;
  try {
    kid = JSON.parse(Buffer.from(rawHeader, 'base64url').toString('utf8')).kid;
  } catch {
    kid = undefined;
  }
  if (!kid) throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'El inicio de sesión con Google no es válido.');
  const key = await getKey(kid);

  let payload: Record<string, unknown>;
  try {
    payload = verify(idToken, key, {
      algorithms: ['RS256'],
      issuer: ISSUERS as [string, ...string[]],
      audience: audiences as [string, ...string[]],
      clockTolerance: 60,
    }) as Record<string, unknown>;
  } catch {
    throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'El inicio de sesión con Google no es válido o expiró.');
  }
  if (nonce && payload.nonce !== nonce) {
    throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'El inicio de sesión con Google no es válido.');
  }
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new GoogleAuthError('GOOGLE_TOKEN_INVALID', 'Google no compartió tu correo.');
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    givenName: typeof payload.given_name === 'string' ? payload.given_name : undefined,
    familyName: typeof payload.family_name === 'string' ? payload.family_name : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}

export const googleRedirectUri = () => `${config.apiPublicUrl}/api/user/google/callback`;

export function googleAuthUrl(state: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: config.google.webClientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    prompt: 'select_account',
    access_type: 'online',
  });
  return `${config.google.authUrl}?${params.toString()}`;
}

/** Intercambia el código de autorización por el ID token y lo verifica */
export async function exchangeGoogleCode(code: string, nonce: string): Promise<GoogleProfile> {
  const res = await fetch(config.google.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.webClientId,
      client_secret: config.google.webClientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }).toString(),
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !body.id_token) {
    throw new GoogleAuthError('GOOGLE_EXCHANGE_FAILED', 'Google no aceptó el inicio de sesión. Intenta de nuevo.');
  }
  return verifyGoogleIdToken(body.id_token, nonce);
}
