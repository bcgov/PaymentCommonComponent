import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { CashService } from './cash.service';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LocationModule, TypeOrmModule.forFeature([CashDepositEntity])],
  providers: [CashService, Logger],
  exports: [CashService, TypeOrmModule]
})
export class CashModule {}
