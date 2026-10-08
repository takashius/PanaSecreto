import { Response } from 'express';

export function sendAuthError(
  res: Response,
  status: number,
  code: string,
  message: string
) {
  res.status(status).json({
    code,
    message,
    error: message,
  });
}

export function mapJwtVerifyError(err: any): { code: string; error: string } {
  if (err?.name === 'TokenExpiredError') {
    return {
      code: 'TOKEN_EXPIRED',
      error: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
    };
  }
  return {
    code: 'TOKEN_INVALID',
    error: 'Token de autenticación inválido o corrupto.',
  };
}

export function mapAuthCatchError(err: any): { status: number; code: string; error: string } {
  return {
    status: 401,
    code: 'AUTH_FAILED',
    error: err?.message || 'Error en autenticación.',
  };
}
