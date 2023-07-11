import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FileUploadedEntity,
      FileIngestionRulesEntity,
      ProgramDailyUploadEntity,
    ]),
  ],

  providers: [UploadsService],
  exports: [UploadsService, TypeOrmModule],
})
export class UploadsModule {}
