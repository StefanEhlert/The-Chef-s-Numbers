import { Request, Response, NextFunction } from 'express';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  const error = new Error(`Route ${_req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
}
