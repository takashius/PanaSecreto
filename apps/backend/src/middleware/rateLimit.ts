import rateLimit from 'express-rate-limit';
import config from '../config/commons';
import type { IGetUserAuthInfoRequest } from '../types/general';

// En tests automatizados los límites se relajan (todas las peticiones salen de la misma IP)
const limit = (max: number) => (config.nodeEnv === 'test' ? 10000 : max);

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: limit(20), // Máximo 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiados intentos de inicio de sesión. Por favor, intenta más tarde en 15 minutos.',
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: limit(10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiados registros desde esta conexión. Intenta más tarde.',
  },
});

/** Invitaciones por correo: por usuario autenticado (no por IP) para evitar spam */
export const invitationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: limit(10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${(req as IGetUserAuthInfoRequest).user?._id ?? 'anon'}`,
  message: {
    code: 'RATE_LIMITED',
    message: 'Enviaste demasiadas invitaciones. Intenta de nuevo en una hora.',
  },
});

export const recoveryRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limit(10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiadas solicitudes de recuperación de contraseña.',
  },
});

export const recoverySubmitRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limit(10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiados intentos de verificación de código de recuperación.',
  },
});

export const legalCancellationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: limit(5),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiadas solicitudes de baja desde esta conexión. Intenta más tarde.',
  },
});
