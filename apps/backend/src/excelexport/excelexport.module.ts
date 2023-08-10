import { Logger, Module } from '@nestjs/common';
import { ExcelExportService } from './excelexport.service';
import { LoggerModule } from '../logger/logger.module';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

@Module({
  imports: [LoggerModule],
  providers: [ExcelExportService, S3ManagerService, Logger],
  exports: [ExcelExportService],
})
export class ExcelExportModule {}
