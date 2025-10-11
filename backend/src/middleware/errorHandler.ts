import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error for debugging
  console.error(`Error ${statusCode}: ${message}`);
  console.error(error.stack);

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    error: {
      message: process.env['NODE_ENV'] === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : message,
      ...(process.env['NODE_ENV'] !== 'production' && { stack: error.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
