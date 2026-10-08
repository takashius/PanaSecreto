import { Request, Response } from 'express';
import { StoreResponse } from '../types/general';

export function sendResult(res: Response, result: StoreResponse, success = 200) {
  if (result.status === success || result.status === 200 || result.status === 201) {
    res.status(result.status).send(result.message);
    return;
  }
  res.status(result.status).send(result.message);
}

export function sendOrError(
  res: Response,
  result: StoreResponse,
  controllerError: Function,
  req: Request
) {
  if (result.status === 200 || result.status === 201) {
    res.status(result.status).send(result.message);
    return;
  }
  if (
    result.status === 400 ||
    result.status === 401 ||
    result.status === 403 ||
    result.status === 404
  ) {
    res.status(result.status).send(result.message);
    return;
  }
  controllerError(result.detail || result.message, req, res);
}
