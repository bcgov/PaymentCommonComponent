import { Global, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import databaseConfig from './database-config';
import { DatabaseService } from './database.service';
import { db } from './datasource';
import { LocationModule } from '../location/location.module';
import { LoggerModule } from '../logger/logger.module';
import { NotificationModule } from '../notification/notification.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<TypeOrmModuleOptions> => {
        return databaseConfig;
      },
    }),
    S3ManagerModule,
    LocationModule,
    TransactionModule,
    NotificationModule,
    LoggerModule,
  ],
  providers: [
    DatabaseService,
    {
      provide: DataSource,
      useFactory: async () => {
        await db.initialize();
        return db;
      },
    },
  ],
  exports: [DataSource, DatabaseService],
})
export class DatabaseModule {}
