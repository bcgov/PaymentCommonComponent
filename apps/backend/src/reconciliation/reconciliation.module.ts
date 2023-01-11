import { CashDepositEntity } from './entities/cash-deposit.entity';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from './entities/payment.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, Logger } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      PaymentEntity,
      POSDepositEntity,
      CashDepositEntity
    ])
  ],
  providers: [ReconciliationService, Logger]
})
export class ReconciliationModule {}
