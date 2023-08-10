import { LoggerService, LogLevel } from '@nestjs/common';
import axios from 'axios';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';

export class AppLogger implements LoggerService {
  private context = 'App Logger';
  private logger;
  private level = 'debug';

  setContext(context: string) {
    this.context = context;
  }
  setLogLevel(level: LogLevel) {
    this.level = level;
  }

  constructor() {
    this.logger = WinstonModule.createLogger({
      level: this.level,
      transports: [
        new winston.transports.Console({
          level: this.level,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize({ all: true }),
            utilities.format.nestLike('App Logger', {
              colors: true,
              prettyPrint: true,
            })
          ),
        }),
      ],
    });
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  log(message: unknown, context?: any) {
    this.logger.log(message, context ?? this.context, this.level);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async error(e: any, context?: string) {
    const error = e as Error & { response?: Error };

    if (axios.isAxiosError(e)) {
      const { response, config } = e;
      const message = {
        url: config?.url,
        method: config?.method,
        ...(response?.data ? { data: response.data } : {}),
      };
      this.logger.error(message, context ?? this.context);
    }
    // For handling manually crafted validation error message arrays, see 'exceptionFactory' in 'app.config.ts'
    if (error.response?.message) {
      this.level = 'error';
      this.logger.error(error.message, context ?? this.context);
    }
    this.logger.error(error.message, context ?? this.context);
  }

  warn(message: unknown, context?: string) {
    this.level = 'warn';
    this.logger.warn(message, context);
  }
}
