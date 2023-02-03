import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashModule } from '../cash/cash.module';
import { LocationModule } from '../location/location.module';
import { PosModule } from '../pos/pos.module';
import { SalesModule } from '../sales/sales.module';
import { ReportingService } from './reporting.service';

@Module({
  imports: [CashModule, PosModule, SalesModule, LocationModule],
  providers: [ReportingService, Logger],
  exports: [ReportingService]
})
export class ReportingModule {}
