import { Injectable, Inject, Optional } from '@nestjs/common';

export const LOGGER_OPTIONS = 'LOGGER_OPTIONS';

export interface LoggerOptions {
  silent?: boolean;
}

@Injectable()
export class LoggerService {
  private readonly silent: boolean;

  constructor(@Optional() @Inject(LOGGER_OPTIONS) options?: LoggerOptions) {
    this.silent = options?.silent || false;
  }

  log(...args: any[]): void {
    if (!this.silent) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    if (!this.silent) {
      console.error(...args);
    } else {
      // In silent mode, write errors to stderr
      process.stderr.write(`${args.join(' ')}\n`);
    }
  }

  warn(...args: any[]): void {
    if (!this.silent) {
      console.warn(...args);
    }
  }

  info(...args: any[]): void {
    if (!this.silent) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (!this.silent && process.env.DEBUG) {
      console.debug(...args);
    }
  }
}
