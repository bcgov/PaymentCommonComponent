import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { ProgramRequiredFileEntity } from './entities/program-required-file.entity';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';
import { DepositModule } from '../deposits/deposit.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    DepositModule,
    TransactionModule,
    TypeOrmModule.forFeature([
      FileUploadedEntity,
      FileIngestionRulesEntity,
      ProgramDailyUploadEntity,
      ProgramRequiredFileEntity,
    ]),
  ],
  controllers: [ParseController],
  providers: [ParseService, Logger],
})
export class ParseModule {}
