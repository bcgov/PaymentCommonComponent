import { Module, Logger } from '@nestjs/common';
import { CashReconciliationService } from './cash-reconciliation.service';
import { POSReconciliationService } from './pos-reconciliation.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [CashReconciliationService, POSReconciliationService, Logger],
  exports: []
})
export class ReconciliationModule {}
