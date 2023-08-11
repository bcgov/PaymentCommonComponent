import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';
import { DatabaseModule } from './database/database.module';
import { DepositModule } from './deposits/deposit.module';
import { ExcelExportModule } from './excelexport/excelexport.module';
import { LocationModule } from './location/location.module';
import { LoggerModule } from './logger/logger.module';
import { NotificationModule } from './notification/notification.module';
import { ParseModule } from './parse/parse.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ReportingModule } from './reporting/reporting.module';
import { S3ManagerModule } from './s3-manager/s3-manager.module';
import { SnsManagerModule } from './sns-manager/sns-manager.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    S3ManagerModule,
    ReconciliationModule,
    DepositModule,
    TransactionModule,
    ParseModule,
    SnsManagerModule,
    LocationModule,
    ExcelExportModule,
    ReportingModule,
    NotificationModule,
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // Globally applies AuthGuard
      provide: APP_GUARD,
      useExisting: AuthGuard,
    },
    AuthGuard,
  ],
})
export class AppModule {}
