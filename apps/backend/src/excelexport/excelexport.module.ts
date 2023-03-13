import { Logger, Module } from '@nestjs/common';
import { ExcelexportService } from './excelexport.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

@Module({
  providers: [ExcelexportService, S3ManagerService, Logger],
  exports: [ExcelexportService]
})
export class ExcelexportModule {}
