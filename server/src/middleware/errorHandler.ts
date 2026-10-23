import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse, logSafeError } from '../errors.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logSafeError(`Express ${req.method} ${req.originalUrl}`, err);
  const formatted = formatErrorResponse(err);
  res.status(formatted.statusCode).json(formatted);
}
