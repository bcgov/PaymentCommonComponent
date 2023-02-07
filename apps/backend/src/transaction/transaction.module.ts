import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { PaymentMethodService } from './payment-method.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { LocationModule } from '../location/location.module';
@Module({
  imports: [
    LocationModule,
    TypeOrmModule.forFeature([
      TransactionEntity,
      PaymentEntity,
      PaymentMethodEntity,
      LocationModule
    ])
  ],
  controllers: [TransactionController],
  providers: [TransactionService, PaymentMethodService, Logger],
  exports: [TypeOrmModule, TransactionService, PaymentMethodService]
})
export class TransactionModule {}
