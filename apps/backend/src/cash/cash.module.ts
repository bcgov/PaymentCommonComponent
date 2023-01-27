import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDepositEntity } from '../reconciliation/entities';
import { CashService } from './cash.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashDepositEntity])],
  providers: [CashService, Logger],
  exports: [CashService]
})
export class CashModule {}
