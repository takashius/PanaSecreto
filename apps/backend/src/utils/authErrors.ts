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

export function mapJwtVerifyError(err: unknown): { code: string; error: string } {
  if ((err as { name?: string } | null)?.name === 'TokenExpiredError') {
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

export function mapAuthCatchError(_err: unknown): { status: number; code: string; error: string } {
  return {
    status: 401,
    code: 'AUTH_FAILED',
    // Sin detalles internos: el error real queda en el log del middleware
    error: 'Error en autenticación.',
  };
}
