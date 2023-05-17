import { LoggerService } from '@nestjs/common';
import axios from 'axios';
import { format as dateFormat } from 'date-fns';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import * as util from 'util';

export class AppLogger implements LoggerService {
  private readonly logger;
  private context?: string;

  public setContext(context: string) {
    this.context = context;
  }

  constructor(context?: string) {
    this.context = context;

    const logFormat = format.combine(
      format.timestamp(),
      format.colorize(),
      format.printf(
        (info) =>
          `[${this.context}] [${info.timestamp}] ${info.level}: ${info.message}`
      )
    );
    this.logger = WinstonModule.createLogger({
      transports: process.env.LOG_FILE
        ? [
            new transports.Console({
              format: logFormat,
              level: 'debug',
            }),
            new transports.File({
              filename: `${dateFormat(new Date(), 'yyyy-MM-dd')}`,
              format: logFormat,
              level: 'verbose',
            }),
          ]
        : [
            new transports.Console({
              format: logFormat,
              level: 'debug',
            }),
          ],
      exitOnError: false,
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
        ...(response?.data ? { data: response.data } : {}),
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
