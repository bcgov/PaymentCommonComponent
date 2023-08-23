import { Logger, Module } from '@nestjs/common';
import { ExcelExportService } from './excelexport.service';
import { LoggerModule } from '../logger/logger.module';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';

@Module({
  imports: [LoggerModule, S3ManagerModule],
  providers: [ExcelExportService, Logger],
  exports: [ExcelExportService],
})
export class ExcelExportModule {}
