import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = process.env.LOG_FILE ? path.dirname(process.env.LOG_FILE) : './logs';

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = process.env.LOG_FILE || './logs/sir-mcp.log';
const logLevel = process.env.LOG_LEVEL || 'info';
const logMaxSize = process.env.LOG_MAX_SIZE || '10m';
const logMaxFiles = process.env.LOG_MAX_FILES || '5';

/**
 * Winston logger instance with file rotation and JSON formatting
 */
export const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'sir-mcp-server' },
  transports: [
    new transports.File({
      filename: logFile,
      maxsize: parseInt(logMaxSize) * 1024 * 1024,
      maxFiles: parseInt(logMaxFiles),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );
}

/**
 * Logs an info message
 */
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  logger.info(message, meta);
}

/**
 * Logs a warning message
 */
export function logWarn(message: string, meta?: Record<string, unknown>): void {
  logger.warn(message, meta);
}

/**
 * Logs an error message
 */
export function logError(message: string, error?: Error, meta?: Record<string, unknown>): void {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
}

/**
 * Logs a debug message
 */
export function logDebug(message: string, meta?: Record<string, unknown>): void {
  logger.debug(message, meta);
}
