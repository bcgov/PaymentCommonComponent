import { SalesModule } from './../sales/sales.module';
import { PosModule } from './../pos/pos.module';
import { CashModule } from './../cash/cash.module';
import { Module, Logger } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { LocationModule } from '../location/location.module';
@Module({
  imports: [CashModule, PosModule, SalesModule, LocationModule],
  providers: [ReconciliationService, Logger],
  exports: [ReconciliationService]
})
export class ReconciliationModule {}
