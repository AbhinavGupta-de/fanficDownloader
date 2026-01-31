/**
 * Error handling middleware
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import logger from '../utils/logger.js';

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
};

/**
 * Global error handler
 */
export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', {
    status,
    message,
    path: req.path,
    method: req.method
  });

  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
