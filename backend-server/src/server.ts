/**
 * Server entry point
 */

import 'dotenv/config';
import app from './app.js';
import logger from './utils/logger.js';
import { initAnalytics, shutdownAnalytics } from './utils/analytics.js';

const PORT = parseInt(process.env.PORT || '8002');

// Initialize analytics
initAnalytics();

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await shutdownAnalytics();
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
