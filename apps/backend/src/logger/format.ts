import winston from 'winston';

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
