import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { AlertDestinationEntity } from './entities/alert-destination.entity';
import {  NotificationService } from './notification.service';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { ProgramRequiredFileEntity } from './entities/program-required-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertDestinationEntity,
      FileIngestionRulesEntity,
      ProgramRequiredFileEntity,
      ProgramDailyUploadEntity,
    ]),
  ],
  providers: [NotificationService, MailService, Logger],
  exports: [NotificationService, MailService,   TypeOrmModule],
})
export class NotificationModule {}
