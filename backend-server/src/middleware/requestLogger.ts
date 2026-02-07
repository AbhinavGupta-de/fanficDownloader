/**
 * Request logging middleware
 */

import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { trackApiRequest } from '../utils/analytics.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    // Track every API request in PostHog
    trackApiRequest(
      req.path,
      req.method,
      res.statusCode,
      duration,
      {
        ip: req.ip || undefined,
        headers: req.headers as Record<string, string | string[] | undefined>
      }
    );
  });

  next();
};
