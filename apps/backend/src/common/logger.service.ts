import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import axios from 'axios';

export class AppLogger implements LoggerService {
  private logger;

  constructor() {
    this.logger = WinstonModule.createLogger({
      transports: [new winston.transports.Console({})],
      exitOnError: false,
    });
  }

  log(message: unknown, context?: string) {
    this.logger.log(message, context);
  }

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
