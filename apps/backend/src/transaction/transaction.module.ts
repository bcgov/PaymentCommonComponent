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
  providers: [TransactionService, Logger],
  exports: [TypeOrmModule, TransactionService]
})
export class TransactionModule {}
