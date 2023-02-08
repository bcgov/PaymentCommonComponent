import { LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { WinstonModule } from 'nest-winston';
import { Repository } from 'typeorm';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import * as util from 'util';
import { LogEntity } from './entities/log.entity';
import { logFileFormat, consoleLogFormat } from './format';

export class AppLogger implements LoggerService {
  private readonly logger;

  constructor(
    @InjectRepository(LogEntity) private logsRepository: Repository<LogEntity>
  ) {
    this.logger = WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: 'info',
          format: consoleLogFormat
        }),
        new DailyRotateFile({
          filename: join(__dirname, 'logs/%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          level: 'info',
          format: logFileFormat
        })
      ],
      exitOnError: false
    });
  }
  async createLog(log: Partial<LogEntity>) {
    return await this.logsRepository.save(this.logsRepository.create(log), {
      data: {
        isCreatingLogs: true
      }
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
