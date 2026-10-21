import { Request, Response } from 'express';

/** Error de Mongoose/MongoDB tal como llega a los catch (forma parcial, sin depender de tipos internos) */
interface DbError {
  name?: string;
  message?: string;
  code?: number | string;
  type?: string;
  keyValue?: Record<string, unknown>;
  errorResponse?: { code?: number; keyValue?: Record<string, unknown> };
  errors?: Record<string, { message?: string }>;
}

const asDbError = (err: unknown): DbError => (err && typeof err === 'object' ? (err as DbError) : {});

const handleDuplicateKeyError = (err: DbError, res: Response) => {
  const keyValue = err.keyValue ?? err.errorResponse?.keyValue;
  if (!keyValue || typeof keyValue !== 'object') {
    return res.status(400).json({ message: 'Violación de unicidad en base de datos.' });
  }
  const field = Object.keys(keyValue)[0];
  return res.status(400).json({ [field]: `Ya existe un registro con ese ${field}.` });
};

const handleValidationError = (err: DbError, res: Response) => {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(err.errors ?? {})) {
    errors[key] = value?.message ?? 'Valor inválido.';
  }
  return res.status(400).json(errors);
};

export default function controllerError(err: unknown, req: Request, res: Response) {
  try {
    if (!err) {
      return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error interno desconocido.' });
    }

    if (typeof err === 'string') {
      return res.status(400).json({ message: err });
    }

    const e = asDbError(err);

    // Errores de negocio ya formateados: { type, message }
    if (e.type && Object.prototype.hasOwnProperty.call(e, 'message')) {
      return res.status(400).json(err);
    }

    if (e.name === 'ValidationError') {
      return handleValidationError(e, res);
    }

    const dupCode = e.code ?? e.errorResponse?.code;
    if (dupCode != null && Number(dupCode) === 11000) {
      return handleDuplicateKeyError(e, res);
    }

    if (e.name === 'custom') {
      return res.status(400).json({ message: e.message });
    }

    if (e.name === 'CastError') {
      return res.status(400).json({ code: 'INVALID_ID', message: 'Identificador inválido.' });
    }

    // Error inesperado: se registra en el servidor y el cliente recibe un mensaje genérico
    console.error(`[${req.method} ${req.originalUrl}] Error no controlado:`, err);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error en el servidor.' });
  } catch (caught) {
    console.error('[controllerError] Error no manejado:', caught);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error interno no manejado.' });
  }
}

/**
 * Traduce un error de guardado de usuario a una respuesta segura para el cliente:
 * validación → primer mensaje; duplicado → correo en uso; otro → 500 genérico.
 */
export function describeSaveError(err: unknown, fallback: string): { status: number; message: string } {
  const e = asDbError(err);
  if (e.name === 'ValidationError') {
    const first = Object.values(e.errors ?? {})[0]?.message;
    return { status: 400, message: first ?? 'Datos inválidos.' };
  }
  if (Number(e.code ?? e.errorResponse?.code) === 11000) {
    return { status: 400, message: 'Ya existe una cuenta registrada con este correo.' };
  }
  return { status: 500, message: fallback };
}
