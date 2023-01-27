import { TypeOrmModule } from '@nestjs/typeorm';
import { Logger, Module } from '@nestjs/common';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      PaymentEntity,
      PaymentMethodEntity
    ])
  ],
  controllers: [SalesController],
  providers: [SalesService, Logger],
  exports: [TypeOrmModule]
})
export class SalesModule {}
