import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, Logger } from '@nestjs/common';
import { PaymentEntity } from './entities/payment.entity';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      POSDepositEntity,
      CashDepositEntity,
      PaymentEntity
    ])
  ],
  providers: [ReconciliationService, Logger],
  controllers: [ReconciliationController],
  exports: [ReconciliationService]
})
export class ReconciliationModule {}
