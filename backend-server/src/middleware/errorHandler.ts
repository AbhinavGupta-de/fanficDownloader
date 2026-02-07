/**
 * Error handling middleware
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import logger from '../utils/logger.js';
import { trackError, trackException } from '../utils/analytics.js';

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

  const reqInfo = {
    ip: req.ip || undefined,
    headers: req.headers as Record<string, string | string[] | undefined>
  };

  // Track error as custom event in PostHog product analytics
  trackError({
    error_type: err.constructor?.name || 'UnknownError',
    error_message: message,
    error_stack: err.stack,
    endpoint: req.path,
    method: req.method,
  }, reqInfo);

  // Track as exception in PostHog error tracking (separate 100K free tier)
  if (err instanceof Error) {
    trackException(err, { endpoint: req.path, method: req.method, status }, reqInfo);
  }

  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
