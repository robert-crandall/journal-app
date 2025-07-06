import { HTTPException } from 'hono/http-exception';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SILENT = 'silent',
}

// Default log level configuration by environment
const DEFAULT_LOG_LEVELS = {
  production: LogLevel.INFO,
  development: LogLevel.DEBUG,
  test: LogLevel.SILENT, // Suppress logs in test environment
};

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  silent4xx: boolean; // Whether to suppress 4xx client errors
  silent5xx: boolean; // Whether to suppress 5xx server errors
}

/**
 * Logger singleton
 */
class Logger {
  private config: LoggerConfig;

  constructor() {
    const environment = process.env.NODE_ENV || 'development';

    // Default configuration
    this.config = {
      level: DEFAULT_LOG_LEVELS[environment as keyof typeof DEFAULT_LOG_LEVELS] || LogLevel.INFO,
      silent4xx: environment === 'test',
      silent5xx: false, // Always log server errors by default
    };
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Determine if a log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);

    return messageIndex >= configIndex && this.config.level !== LogLevel.SILENT;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (!this.isLevelEnabled(LogLevel.DEBUG)) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (!this.isLevelEnabled(LogLevel.INFO)) return;
    console.info(`[INFO] ${message}`, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (!this.isLevelEnabled(LogLevel.WARN)) return;
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: any, ...args: any[]): void {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;

    // Special handling for HTTPExceptions
    if (error instanceof HTTPException) {
      // Skip 4xx errors if configured to be silent
      if (error.status >= 400 && error.status < 500 && this.config.silent4xx) {
        return;
      }

      // Skip 5xx errors if configured to be silent
      if (error.status >= 500 && this.config.silent5xx) {
        return;
      }
    }

    console.error(`[ERROR] ${message}`, error, ...args);
  }

  /**
   * Log an HTTP exception with proper filtering
   */
  httpError(message: string, error: HTTPException, ...args: any[]): void {
    // Skip client errors if configured
    if (error.status >= 400 && error.status < 500 && this.config.silent4xx) {
      return;
    }

    // Skip server errors if configured
    if (error.status >= 500 && this.config.silent5xx) {
      return;
    }

    this.error(`${message} [${error.status}]`, error, ...args);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Initialize logger from environment variables
if (process.env.LOG_LEVEL) {
  logger.configure({
    level: process.env.LOG_LEVEL as LogLevel,
    silent4xx: process.env.LOG_SILENT_4XX === 'true',
    silent5xx: process.env.LOG_SILENT_5XX === 'true',
  });
}

/**
 * Standard error handler function for API routes
 * Logs the error and throws an HTTPException
 *
 * @param error - The caught error
 * @param message - User-friendly error message to return in the response
 * @param status - HTTP status code (defaults to 500)
 * @throws HTTPException
 */
export function handleApiError(error: unknown | null | undefined, message: string, status: number = 500): never {
  // If there's no error, just log and throw a generic HTTPException
  if (!error) {
    logger.error(message);
    throw new HTTPException(status as any, { message });
  }

  // If error is already an HTTPException, log it and rethrow
  if (error instanceof HTTPException) {
    logger.httpError(message, error);
    throw error;
  }

  // For other errors, log and throw a new HTTPException
  logger.error(message, error);
  throw new HTTPException(status as any, { message, cause: error });
}

// Export for easy importing
export default logger;
