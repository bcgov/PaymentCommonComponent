import { LoggerService } from '@nestjs/common';
import axios from 'axios';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';

export class AppLogger implements LoggerService {
  private logger;
  private context = 'App Logger';

  setContext(context: string) {
    this.context = context;
  }

  constructor() {
    this.logger = WinstonModule.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ all: true }),
        utilities.format.nestLike('App Logger', {
          colors: true,
          prettyPrint: true,
        })
      ),
      transports: [new winston.transports.Console({})],
    });
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  log(message: unknown, context?: any) {
    this.logger.log(message, context ?? this.context);
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
      this.logger.error(error.message, context ?? this.context);
    }
    this.logger.error(e, context ?? this.context);
  }

  warn(message: unknown, context?: string) {
    this.logger.warn(message, context);
  }
}
