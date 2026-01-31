/**
 * Simple logger utility
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogMetadata {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
  const timestamp = new Date().toISOString();
  const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, metadata?: LogMetadata): void {
    console.log(formatMessage('INFO', message, metadata));
  },

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(formatMessage('WARN', message, metadata));
  },

  error(message: string, metadata?: LogMetadata): void {
    console.error(formatMessage('ERROR', message, metadata));
  },

  debug(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', message, metadata));
    }
  }
};

export default logger;
