import { Logger, Module } from '@nestjs/common';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';
import { ReportingService } from './reporting.service';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [ReportingService, Logger],
  exports: [ReportingService]
})
export class ReportingModule {}
