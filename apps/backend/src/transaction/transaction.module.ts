import { TypeOrmModule } from '@nestjs/typeorm';
import { Logger, Module } from '@nestjs/common';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { LocationModule } from '../location/location.module';
import { PaymentMethodService } from './payment-method.service';
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
