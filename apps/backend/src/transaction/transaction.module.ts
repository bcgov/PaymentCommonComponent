import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity,
} from './entities';
import { PaymentMethodService } from './payment-method.service';
import { PaymentService } from './payment.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { LoggerModule } from '../logger/logger.module';
@Module({
  imports: [
    LocationModule,
    DepositModule,
    LoggerModule,
    TypeOrmModule.forFeature([
      TransactionEntity,
      PaymentEntity,
      PaymentMethodEntity,
      LocationModule,
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, PaymentService, PaymentMethodService, Logger],
  exports: [
    TypeOrmModule,
    TransactionService,
    PaymentMethodService,
    PaymentService,
  ],
})
export class TransactionModule {}
