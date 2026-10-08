import { Request, Response } from 'express';

const handleDuplicateKeyError = (err: any, res: Response) => {
  const keyValue = err.keyValue ?? err.errorResponse?.keyValue;
  if (!keyValue || typeof keyValue !== 'object') {
    return res.status(400).json({ message: 'Violación de unicidad en base de datos.' });
  }
  const field = Object.keys(keyValue)[0];
  const errors: Record<string, string> = {};
  errors[field] = `Ya existe un registro con ese ${field}.`;
  return res.status(400).json(errors);
};

const handleValidationError = (err: any, res: Response) => {
  const errors: Record<string, string> = {};
  if (err.errors) {
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }
  return res.status(400).json(errors);
};

export default function controllerError(err: any, req: Request, res: Response) {
  try {
    if (!err) {
      return res.status(500).json({ message: 'Error interno desconocido.' });
    }

    if (
      err &&
      typeof err === 'object' &&
      err.type &&
      Object.prototype.hasOwnProperty.call(err, 'message')
    ) {
      return res.status(400).json(err);
    }

    if (err.name === 'ValidationError') {
      return handleValidationError(err, res);
    }

    const dupCode = err.code ?? err.errorResponse?.code;
    if (dupCode != null && Number(dupCode) === 11000) {
      return handleDuplicateKeyError(err, res);
    }

    if (err.name === 'custom' || err.message) {
      return res.status(400).json({ message: err.message });
    }

    if (typeof err === 'string') {
      return res.status(400).json({ message: err });
    }

    return res.status(500).json({ message: 'Error en el servidor.' });
  } catch (caught) {
    console.error('[controllerError] Error no manejado:', caught);
    return res.status(500).json({ message: 'Error interno no manejado.' });
  }
}
