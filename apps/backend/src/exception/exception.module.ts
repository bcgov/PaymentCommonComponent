import { Logger, Module } from '@nestjs/common';
import { DepositModule } from '../deposits/deposit.module';
import { LocationModule } from '../location/location.module';
import { SalesModule } from '../sales/sales.module';
import { ExceptionService } from './exception.service';

@Module({
  imports: [DepositModule, SalesModule, LocationModule],
  providers: [ExceptionService, Logger],
  exports: [ExceptionService]
})
export class ExceptionModule {}
