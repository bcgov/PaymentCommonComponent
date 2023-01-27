import { SalesModule } from './../sales/sales.module';
import { PosModule } from './../pos/pos.module';
import { CashModule } from './../cash/cash.module';
import { Module, Logger } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [CashModule, PosModule, SalesModule],
  providers: [ReconciliationService, Logger],
  controllers: [ReconciliationController],
  exports: [ReconciliationService]
})
export class ReconciliationModule {}
