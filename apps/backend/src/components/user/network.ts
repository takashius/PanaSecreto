import { Router, Request, Response } from 'express';
import * as controller from './controller';
import auth, { authAdminOnly, authSuperAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { uploadImages } from '../../services/storage';
import { sendOrError, sendResult } from '../../utils/http';
import {
  loginRateLimiter,
  recoveryRequestRateLimiter,
  recoverySubmitRateLimiter,
  registerRateLimiter,
} from '../../middleware/rateLimit';
import { ALL_ROLES, ROLE_DESCRIPTIONS } from '../../config/roles';
import { IGetUserAuthInfoRequest } from '../../types/general';
import { randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import config from '../../config/commons';
import {
  exchangeGoogleCode,
  GoogleAuthError,
  googleAuthUrl,
  isGoogleConfigured,
  verifyGoogleIdToken,
} from '../../services/google';

const router: Router = Router();

// Iniciar sesión
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, client } = req.body;
    const result = await controller.loginUser(email, password, client);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Registro público (ej. desde mobile app)
router.post('/register', registerRateLimiter, async (req: Request, res: Response) => {
  try {
    const result = await controller.registerUser(req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

/* ---------------------------------------------------------------- Google */

/** Si el botón de Google debe mostrarse activo en la app */
router.get('/google/config', (_req: Request, res: Response) => {
  res.json({ enabled: isGoogleConfigured() });
});

// Inicio de sesión con un ID token de Google (inicio de sesión nativo o Google Identity Services en la web)
router.post('/google', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { idToken, client } = req.body ?? {};
    if (typeof idToken !== 'string' || !idToken) {
      res.status(400).send({ code: 'VALIDATION_ERROR', message: 'Falta el token de Google.' });
      return;
    }
    const profile = await verifyGoogleIdToken(idToken);
    const result = await controller.loginWithGoogle(profile, client === 'web' ? 'web' : 'mobile');
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      res.status(error.code === 'GOOGLE_NOT_CONFIGURED' ? 503 : 401).send({ code: error.code, message: error.message });
      return;
    }
    controllerError(error, req, res);
  }
});

const STATE_MINUTES = 10;

/** El navegador solo puede volver a la app (esquemas permitidos) o, en desarrollo, a localhost */
function isAllowedAppRedirect(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length > 500) return false;
  try {
    const url = new URL(raw);
    const scheme = url.protocol.replace(':', '').toLowerCase();
    if (config.google.appRedirectSchemes.includes(scheme)) return true;
    return config.dev && (scheme === 'http' || scheme === 'https') && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function withParams(base: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${base}${base.includes('?') ? '&' : '?'}${query}`;
}

function closePage(res: Response, message: string) {
  res
    .status(400)
    .type('html')
    .send(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EntrePanas</title>` +
        `<body style="font-family:system-ui,sans-serif;background:#F8F7F2;color:#13213A;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">` +
        `<div><p style="font-size:40px;margin:0">🦜</p><h1 style="font-size:20px">No pudimos completar el inicio de sesión</h1><p>${message}</p><p>Cierra esta ventana y vuelve a la app.</p></div></body>`
    );
}

// Paso 1 (app): abre el navegador aquí; redirige a Google con un state firmado
router.get('/google/start', loginRateLimiter, (req: Request, res: Response) => {
  const redirect = req.query.redirect;
  if (!isAllowedAppRedirect(redirect)) {
    closePage(res, 'La dirección de regreso a la app no es válida.');
    return;
  }
  if (!isGoogleConfigured()) {
    res.redirect(withParams(redirect, { error: 'GOOGLE_NOT_CONFIGURED' }));
    return;
  }
  const nonce = randomBytes(16).toString('base64url');
  const client = req.query.client === 'web' ? 'web' : 'mobile';
  const state = sign({ typ: 'google_state', redirect, nonce, client }, config.JWT_KEY, { expiresIn: `${STATE_MINUTES}m` });
  res.redirect(googleAuthUrl(state, nonce));
});

// Paso 2 (Google → API): canjea el código, inicia sesión y vuelve a la app con un ticket de un solo uso
router.get('/google/callback', async (req: Request, res: Response) => {
  let state: { typ?: string; redirect?: string; nonce?: string; client?: 'web' | 'mobile' };
  try {
    state = verify(String(req.query.state ?? ''), config.JWT_KEY) as typeof state;
    if (state.typ !== 'google_state' || !isAllowedAppRedirect(state.redirect) || !state.nonce) throw new Error('state');
  } catch {
    closePage(res, 'El enlace expiró o no es válido.');
    return;
  }
  const back = (params: Record<string, string>) => res.redirect(withParams(state.redirect as string, params));
  try {
    if (req.query.error) return back({ error: req.query.error === 'access_denied' ? 'GOOGLE_CANCELLED' : 'GOOGLE_ERROR' });
    if (typeof req.query.code !== 'string') return back({ error: 'GOOGLE_ERROR' });
    const profile = await exchangeGoogleCode(req.query.code, state.nonce);
    const result = await controller.loginWithGoogle(profile, state.client);
    if (result.status >= 400) {
      const m = result.message as { code?: string; message?: string } | string;
      return back({
        error: typeof m === 'string' ? 'GOOGLE_ERROR' : m.code || 'GOOGLE_ERROR',
        message: typeof m === 'string' ? m : m.message || '',
      });
    }
    const session = result.message as { _id: string; token: string; isNew?: boolean };
    const ticket = await controller.createAuthTicket(session);
    return back({ ticket });
  } catch (error) {
    if (error instanceof GoogleAuthError) return back({ error: error.code, message: error.message });
    console.error('[google] Error en el callback:', error);
    return back({ error: 'GOOGLE_ERROR' });
  }
});

// Paso 3 (app): canjea el ticket por la sesión
router.post('/google/exchange', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const result = await controller.exchangeAuthTicket(req.body?.ticket);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Perfil del usuario autenticado
router.get('/me', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.getUserProfile(req.user!._id);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Aceptar términos y privacidad vigentes (obligatorio tras cambios)
router.post('/accept-legal', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.acceptLegal(req.user!._id);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Actualizar datos de perfil (nombre, apellido, teléfono, password)
router.patch('/me', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.updateProfile(req.user!._id, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Subir foto de perfil a Cloudinary
router.post('/upload', auth(), uploadImages([{ name: 'photo', folder: 'avatars' }]), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.uploadUserPhoto(req.user!._id, req.uploads?.photo);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Quitar foto de perfil
router.delete('/photo', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.removeUserPhoto(req.user!._id);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cerrar sesión activa
router.post('/logout', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.logoutUser(req.user!._id, req.token!);
    sendResult(res, result);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cerrar todas las sesiones
router.post('/me/logoutall', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.logoutAll(req.user!._id);
    sendResult(res, result);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cambio voluntario de contraseña
router.post('/change-password', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // La contraseña actual la exige el store (no aplica a cuentas de Google sin contraseña propia)
    const result = await controller.changePassword(req.user!._id, oldPassword, newPassword, req.token);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cambio obligatorio de contraseña (forcePasswordChangeOnNextLogin)
router.post('/change_password_required', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const { password } = req.body;
    const result = await controller.changeRequiredPassword(req.user!._id, password, req.token);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Paso 1 de recuperación: envía el código por correo (POST para no exponer el email en la URL)
router.post('/recovery/request', recoveryRequestRateLimiter, async (req: Request, res: Response) => {
  try {
    const result = await controller.recoveryStepOne(req.body?.email);
    sendResult(res, result);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Paso 2 de recuperación
router.post('/recovery', recoverySubmitRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, code, newPass } = req.body;
    const result = await controller.recoveryStepTwo(email, Number(code), newPass);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Catálogo de roles
router.get('/roles', authAdminOnly(), (_req: Request, res: Response) => {
  res.json({
    roles: ALL_ROLES,
    descriptions: ROLE_DESCRIPTIONS,
  });
});

/* ==============================================================
   RUTAS DE ADMINISTRACIÓN DE USUARIOS (/user/admin)
   ============================================================== */

// Listar usuarios con filtros y paginación
router.get('/admin', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.listUsersAdmin(req.query);
    sendResult(res, result);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Crear usuario desde el panel
router.post('/admin', authAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.createUserAdmin(req.user!.role, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Consultar usuario por ID
router.get('/admin/:id', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.getUserAdminDetail(req.params.id);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Actualizar usuario
router.patch('/admin/:id', authAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.updateUserAdmin(req.user!.role, req.params.id, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cambiar rol
router.patch('/admin/:id/role', authSuperAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.setUserRole(req.user!._id, req.params.id, req.body?.role);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Activar / Desactivar
router.patch('/admin/:id/active', authAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.setUserActive(req.user!, req.params.id, req.body?.active);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Resetear contraseña
router.patch('/admin/:id/password', authAdminOnly(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.setUserPassword(req.user!.role, req.params.id, req.body?.password);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Forzar cambio de contraseña en próximo inicio
router.patch(
  '/admin/:id/force-password-change',
  authAdminOnly(),
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
      const result = await controller.setUserForcePasswordChange(
        req.user!.role,
        req.params.id,
        req.body?.forcePasswordChangeOnNextLogin
      );
      sendOrError(res, result, controllerError, req);
    } catch (error) {
      controllerError(error, req, res);
    }
  }
);

export default router;
