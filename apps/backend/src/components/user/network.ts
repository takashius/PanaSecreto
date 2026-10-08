import { Router, Request, Response } from 'express';
import * as controller from './controller';
import auth, { authAdminOnly, authSuperAdminOnly } from '../../middleware/auth';
import controllerError from '../../middleware/controllerError';
import { upload } from '../../middleware/saveFile';
import { sendOrError, sendResult } from '../../utils/http';
import { loginRateLimiter, recoveryRequestRateLimiter, recoverySubmitRateLimiter } from '../../middleware/rateLimit';
import { ALL_ROLES, ROLE_DESCRIPTIONS } from '../../config/roles';
import { IGetUserAuthInfoRequest } from '../../types/general';

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
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await controller.registerUser(req.body);
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

// Actualizar datos de perfil (nombre, apellido, teléfono, password)
router.patch('/me', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.updateProfile(req.user!._id, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

router.patch('/', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.updateProfile(req.user!._id, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Subir foto de perfil a Cloudinary
router.post('/upload', auth(), upload.single('photo'), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.uploadUserPhoto(req.user!._id, req.file);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

router.post('/me/photo', auth(), upload.single('photo'), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const result = await controller.uploadUserPhoto(req.user!._id, req.file);
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

router.post('/me/logout', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
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
    if (!oldPassword) {
      res.status(400).send('La contraseña actual es requerida.');
      return;
    }
    const result = await controller.changePassword(req.user!._id, oldPassword, newPassword);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cambio obligatorio de contraseña (forcePasswordChangeOnNextLogin)
router.post('/change_password_required', auth(), async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const { password } = req.body;
    const result = await controller.changePassword(req.user!._id, '', password);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Paso 1 de recuperación
router.get('/recovery/:email', recoveryRequestRateLimiter, async (req: Request, res: Response) => {
  try {
    const result = await controller.recoveryStepOne(req.params.email);
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
router.post('/admin', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.createUserAdmin(req.body);
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
router.patch('/admin/:id', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.updateUserAdmin(req.params.id, req.body);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Cambiar rol
router.patch('/admin/:id/role', authSuperAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.setUserRole(req.params.id, req.body.role);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Activar / Desactivar
router.patch('/admin/:id/active', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.setUserActive(req.params.id, req.body.active);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Resetear contraseña
router.patch('/admin/:id/password', authAdminOnly(), async (req: Request, res: Response) => {
  try {
    const result = await controller.setUserPassword(req.params.id, req.body.password);
    sendOrError(res, result, controllerError, req);
  } catch (error) {
    controllerError(error, req, res);
  }
});

// Forzar cambio de contraseña en próximo inicio
router.patch(
  '/admin/:id/force-password-change',
  authAdminOnly(),
  async (req: Request, res: Response) => {
    try {
      const result = await controller.setUserForcePasswordChange(
        req.params.id,
        req.body.forcePasswordChangeOnNextLogin
      );
      sendOrError(res, result, controllerError, req);
    } catch (error) {
      controllerError(error, req, res);
    }
  }
);

export default router;
