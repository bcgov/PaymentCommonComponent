import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { join } from 'path';
import { DatabaseLogger } from './database-logger';

const config: PostgresConnectionOptions = {
  type: 'postgres',
  port: +(process.env.DB_PORT || 5432),
  connectTimeoutMS: 5000,
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'pcc',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  entities: ['dist/src/**/entity/*.entity.js'],
  migrations: ['dist/src/database/migrations/*.js'],
  synchronize: false,
  migrationsRun: true,
  logging: !!process.env.DEBUG,
  logger: process.env.DEBUG ? new DatabaseLogger() : undefined
};

const getEnvironmentSpecificConfig = (env?: string) => {
  switch (env) {
    case 'production':
      return {
        entities: [join(__dirname, '../**/*.entity.js')],
        migrations: [join(__dirname, '../migration/*.js')],
        logging: ['migration'] as LoggerOptions
      };
    default:
      return {
        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/src/database/migrations/*.js'],
        logging: ['error', 'warn', 'migration'] as LoggerOptions
      };
  }
};

const nodeEnv = process.env.NODE_ENV;
const environmentSpecificConfig = getEnvironmentSpecificConfig(nodeEnv);

export const appOrmConfig: PostgresConnectionOptions = {
  ...config,
  ...environmentSpecificConfig,
  synchronize: false,
  migrationsRun: false
};

console.log(appOrmConfig);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => appOrmConfig
    })
  ]
})
export class DatabaseModule {}
