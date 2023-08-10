import { Module, Logger } from '@nestjs/common';
import { CashExceptionsService } from './cash-exceptions.service';
import { CashReconciliationService } from './cash-reconciliation.service';
import { PosReconciliationService } from './pos-reconciliation.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { LoggerModule } from '../logger/logger.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule, LoggerModule],
  providers: [
    CashReconciliationService,
    PosReconciliationService,
    Logger,
    CashExceptionsService,
  ],
  exports: [],
})
export class ReconciliationModule {}
