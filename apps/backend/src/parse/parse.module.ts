import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';
import { DepositModule } from '../deposits/deposit.module';
import { NotificationModule } from '../notification/notification.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    S3ManagerModule,
    DepositModule,
    TransactionModule,
    NotificationModule,
    TypeOrmModule.forFeature([FileUploadedEntity]),
  ],
  controllers: [ParseController],
  providers: [ParseService, Logger],
  exports: [TypeOrmModule],
})
export class ParseModule {}
