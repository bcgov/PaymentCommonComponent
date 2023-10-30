import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { join } from 'path';
import { DatabaseLogger } from './database-logger';
import { DatabaseService } from './database.service';
import { entities } from './entity.config';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { NotificationModule } from '../notification/notification.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

const config: PostgresConnectionOptions = {
  type: 'postgres',
  port: +(process.env.DB_PORT || 5432),
  connectTimeoutMS: 10000,
  maxQueryExecutionTime: 25000,
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'pcc',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  logging: !!process.env.DEBUG,
  logger: process.env.DEBUG ? new DatabaseLogger() : undefined,
};

const getEnvironmentSpecificConfig = (env?: string) => {
  switch (env) {
    case 'production':
      return {
        synchronize: false,
        migrationsRun: false,
        // Manually specify entities to load seeing as the glob pattern
        // will not work when running the built app due to webpack
        // bundling.
        entities,
        migrations: [join(__dirname, '../migrations/*.js')],
        logging: ['migration'] as LoggerOptions,
      };
    case 'test':
      return {
        synchronize: false,
        migrationsRun: false,
        autoLoadEntities: true,
        entities: [join(__dirname, '../**/*.entity.{js,ts}')],
        migrations: [join(__dirname, '../migrations/*.{js,ts}')],
        logging: ['migration'] as LoggerOptions,
      };
    case 'ci':
      return {
        synchronize: true,
        migrationsRun: true,
        autoLoadEntities: true,
        dropSchema: true,
        entities: [join(__dirname, '../**/*.entity.{js,ts}')],
        migrations: [join(__dirname, '../migrations/*.{js,ts}')],
        logging: ['migration'] as LoggerOptions,
      };
    default:
      return {
        synchronize: false,
        migrationsRun: false,
        autoLoadEntities: true,
        logging: ['error', 'warn', 'migration'] as LoggerOptions,
      };
  }
};

const nodeEnv = process.env.NODE_ENV;
const environmentSpecificConfig = getEnvironmentSpecificConfig(nodeEnv);

export const appOrmConfig: PostgresConnectionOptions = {
  ...config,
  ...environmentSpecificConfig,
};

@Module({
  imports: [
    S3ManagerModule,
    LocationModule,
    TransactionModule,
    DepositModule,
    NotificationModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => appOrmConfig,
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
