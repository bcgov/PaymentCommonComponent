import { PaymentMethod } from './entities/payment-method.entity';
import { CashDepositEntity } from './entities/cash-deposits';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from './entities/payment.entity';
import { LocationEntity } from './entities/location.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      LocationEntity,
      PaymentEntity,
      POSDepositEntity,
      CashDepositEntity,
      PaymentMethod
    ])
  ],
  providers: [ReconciliationService]
})
export class ReconciliationModule {}
