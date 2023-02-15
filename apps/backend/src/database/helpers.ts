import { LoggerOptions } from 'typeorm';
import { DatabaseLogger } from './database-logger';

export const loggerOptions: LoggerOptions = ['query', 'error', 'schema'];
export const logLevels =
  process.env.DB_LOGS_ENABLED === 'true' ? loggerOptions : undefined;
export const dbLogger =
  process.env.DB_LOGS_ENABLED === 'true' ? new DatabaseLogger() : undefined;
