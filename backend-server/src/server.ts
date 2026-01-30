/**
 * Server entry point
 */

import 'dotenv/config';
import app from './app.js';
import logger from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '8002');

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    port: PORT
  });
});
