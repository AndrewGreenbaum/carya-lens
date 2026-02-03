// Structured logging utility

import { APP_NAME, IS_DEV, LOG_LEVEL } from '../constants/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private prefix = `[${APP_NAME}]`;
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${this.prefix} [${level.toUpperCase()}] ${timestamp} - ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  group(label: string): void {
    if (IS_DEV) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (IS_DEV) {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new Logger(LOG_LEVEL as LogLevel);
