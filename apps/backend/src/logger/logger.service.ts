import { LoggerService } from '@nestjs/common';
import axios from 'axios';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import * as util from 'util';

export class AppLogger implements LoggerService {
  private readonly logger;
  constructor() {
    this.logger = WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.simple(),
            winston.format.colorize()
          ),
          level: 'debug',
          silent: process.env.NODE_ENV !== 'local' ? true : false
        }),
        new DailyRotateFile({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
            winston.format.colorize()
          ),
          level: 'info',
          silent: process.env.NODE_ENV !== 'local' ? true : false,
          filename: join(__dirname, 'logs/%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true
        })
      ],
      exitOnError: false
    });
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  log(message: unknown, context?: any) {
    this.logger.log(util.format(message ?? '', context ?? ''));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async error(e: any, context?: string) {
    const error = e as Error & { response?: Error };
    let message: string | object = error.message;

    if (typeof e === 'string') {
      message = e;
    }

    if (axios.isAxiosError(e)) {
      const { response, config } = e;
      message = {
        url: config?.url,
        method: config?.method,
        ...(response?.data ? { data: response.data } : {})
      };
    }
    // For handling manually crafted validation error message arrays, see 'exceptionFactory' in 'app.config.ts'
    if (error.response?.message) {
      message = error.response?.message;
    }
    process.env.TARGET_ENV || 'N/A';
    this.logger.error(message, error.stack, context);
  }

  warn(message: unknown, context?: string) {
    this.logger.warn(message, context);
  }
}
