import { Logger, Module } from '@nestjs/common';
import { ParseService } from './parse.service';
import { AlertsModule } from '../alerts/alerts.module';
import { DepositModule } from '../deposits/deposit.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    DepositModule,
    S3ManagerModule,
    AlertsModule,
    UploadsModule,
  ],
  providers: [ParseService, Logger],
  exports: [ParseService],
})
export class ParseModule {}
