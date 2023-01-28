import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { CashService } from './cash.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashDepositEntity])],
  providers: [CashService, Logger],
  exports: [CashService, TypeOrmModule]
})
export class CashModule {}
