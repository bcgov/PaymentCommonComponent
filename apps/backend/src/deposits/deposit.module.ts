import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDepositService } from './cash-deposit.service';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PosDepositService } from './pos-deposit.service';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    LocationModule,
    TypeOrmModule.forFeature([POSDepositEntity, CashDepositEntity])
  ],
  providers: [PosDepositService, CashDepositService, Logger],
  exports: [PosDepositService, CashDepositService, TypeOrmModule]
})
export class DepositModule {}
