import { Module } from '@nestjs/common';

import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './database-config';
import { DatabaseService } from './database.service';
import { LocationModule } from '../location/location.module';
import { NotificationModule } from '../notification/notification.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

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
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
