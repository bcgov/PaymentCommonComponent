import { Module } from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';
import { CashExceptionsService } from './cash-exceptions.service';
import { CashReconciliationService } from './cash-reconciliation.service';
import { POSReconciliationService } from './pos-reconciliation.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [
    AppLogger,
    CashReconciliationService,
    POSReconciliationService,
    CashExceptionsService,
  ],
  exports: [],
})
export class ReconciliationModule {}
