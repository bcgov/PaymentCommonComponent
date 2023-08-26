import { Logger, Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { DepositModule } from '../deposits/deposit.module';
import { ExcelExportModule } from '../excelexport/excelexport.module';
import { LocationModule } from '../location/location.module';
import { LoggerModule } from '../logger/logger.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    LocationModule,
    ExcelExportModule,
    DepositModule,
    TransactionModule,
    LoggerModule,
    S3ManagerModule,
  ],
  providers: [ReportingService, Logger],
  exports: [ReportingService],
})
export class ReportingModule {}
