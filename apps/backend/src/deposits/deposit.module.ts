import { CashDepositEntity } from './entities/cash-deposit.entity';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PosDepositService } from './pos-deposit.service';
import { CashDepositService } from './cash-deposit.service';
import { LocationModule } from '../location/location.module';
import { PosDepositQueryService } from './pos-deposit.repository';

@Module({
  imports: [
    LocationModule,
    TypeOrmModule.forFeature([POSDepositEntity, CashDepositEntity])
  ],
  providers: [
    PosDepositService,
    CashDepositService,
    Logger,
    PosDepositQueryService
  ],
  exports: [PosDepositService, CashDepositService, TypeOrmModule]
})
export class DepositModule {}
