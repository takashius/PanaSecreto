import { Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { StoreResponse } from '../types/general';
import type { IGetUserAuthInfoRequest } from '../types/general';

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
  _controllerError: (err: unknown, req: Request, res: Response) => unknown,
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

/* ------------------------------------------------------------------
 * Helpers compartidos por los routers de los módulos
 * ------------------------------------------------------------------ */

type Handler = (req: IGetUserAuthInfoRequest) => Promise<StoreResponse> | StoreResponse;

/** Envuelve un handler: ejecuta, responde y captura errores inesperados. */
export const handleStore =
  (fn: Handler, onError: (err: unknown, req: Request, res: Response) => unknown) =>
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
      const result = await fn(req);
      sendOrError(res, result, onError, req);
    } catch (error) {
      onError(error, req, res);
    }
  };

/** Valida con Zod: devuelve los datos o una respuesta 400 lista para enviar */
export function validateBody<S extends ZodTypeAny>(
  schema: S,
  body: unknown
): { data: z.output<S>; error?: undefined } | { data?: undefined; error: StoreResponse } {
  const parsed = schema.safeParse(body ?? {});
  if (parsed.success) return { data: parsed.data };
  return {
    error: {
      status: 400,
      message: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      },
    },
  };
}
