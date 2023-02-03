import { TypeOrmModule } from '@nestjs/typeorm';
import { Logger, Module } from '@nestjs/common';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
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
  controllers: [SalesController],
  providers: [SalesService, Logger],
  exports: [TypeOrmModule, SalesService]
})
export class SalesModule {}
