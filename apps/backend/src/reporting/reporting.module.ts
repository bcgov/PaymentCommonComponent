import { Logger, Module } from '@nestjs/common';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { SalesModule } from '../sales/sales.module';
import { ReportingService } from './reporting.service';

@Module({
  imports: [DepositModule, SalesModule, LocationModule],
  providers: [ReportingService, Logger],
  exports: [ReportingService]
})
export class ReportingModule {}
