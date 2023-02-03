import { POSReconciliationService } from './pos-reconciliation.service';
import { CashReconciliationService } from './cash-reconciliation.service';
import { TransactionModule } from '../transaction/transaction.module';
import { DepositModule } from '../deposits/deposit.module';
import { Module, Logger } from '@nestjs/common';

import { LocationModule } from '../location/location.module';
@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [CashReconciliationService, POSReconciliationService, Logger],
  exports: []
})
export class ReconciliationModule {}
