import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

export const logFileFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.label({ label: 'AppLog' }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.label}: ${info.message}${
        info.splat !== undefined ? info.splat : ''
      }`
  )
);

export const consoleLogFormat = winston.format.combine(
  winston.format.combine(winston.format.colorize(), winston.format.simple())
);

const consoleTransport = new winston.transports.Console({
  level: 'info',
  format: consoleLogFormat
});

export const transports =
  process.env.APP_ENV === 'local'
    ? [consoleTransport, new DailyRotateFile({
      filename: join(__dirname, 'logs/%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      level: 'info',
      format: logFileFormat
    })]
    : [consoleTransport];
