import { Request, Response } from 'express';
import { StoreResponse } from '../types/general';

export function sendResult(res: Response, result: StoreResponse, _success = 200) {
  res.status(result.status).send(result.message);
}

/**
 * Responde según el estado del store:
 *  - 2xx y 4xx: se envían tal cual (409, 422, etc. incluidos).
 *  - 5xx: se registra el detalle en el servidor y el cliente recibe un mensaje genérico.
 */
export function sendOrError(
  res: Response,
  result: StoreResponse,
  _controllerError: Function,
  req: Request
) {
  if (result.status < 500) {
    res.status(result.status).send(result.message);
    return;
  }
  console.error(`[${req.method} ${req.originalUrl}]`, result.detail ?? result.message);
  res.status(result.status).send({
    code: 'INTERNAL_ERROR',
    message: typeof result.message === 'string' ? result.message : 'Error en el servidor.',
  });
}
