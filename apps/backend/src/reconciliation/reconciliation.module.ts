import { Module, Logger } from '@nestjs/common';
import { CashExceptionsService } from './cash-exceptions.service';
import { CashReconciliationService } from './cash-reconciliation.service';
import { PosMatchHeuristics } from './pos-heuristics';
import { PosReconciliationService } from './pos-reconciliation.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [
    CashReconciliationService,
    PosReconciliationService,
    Logger,
    CashExceptionsService,
    PosMatchHeuristics
  ],
  exports: [],
})
export class ReconciliationModule {}
