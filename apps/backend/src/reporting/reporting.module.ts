import { Logger, Module } from '@nestjs/common';
// import { DetailedReportService } from './details-report.service';
import { ReportingService } from './reporting.service';
import { DepositModule } from '../deposits/deposit.module';
import { ExcelExportModule } from '../excelexport/excelexport.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    LocationModule,
    ExcelExportModule,
    DepositModule,
    TransactionModule,
  ],
  providers: [ReportingService, Logger],
  exports: [ReportingService],
})
export class ReportingModule {}
