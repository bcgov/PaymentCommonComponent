import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';
import { DepositModule } from '../deposits/deposit.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    DepositModule,
    S3ManagerModule,
    TypeOrmModule.forFeature([
      FileUploadedEntity,
      FileIngestionRulesEntity,
      ProgramDailyUploadEntity,
    ]),
  ],
  controllers: [ParseController],
  providers: [ParseService, Logger],
})
export class ParseModule {}
