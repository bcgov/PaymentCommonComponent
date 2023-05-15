import { Logger, Module } from '@nestjs/common';
import { ExceptionService } from './exception.service';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [DepositModule, TransactionModule, LocationModule],
  providers: [ExceptionService, Logger],
  exports: [ExceptionService],
})
export class ExceptionModule {}
