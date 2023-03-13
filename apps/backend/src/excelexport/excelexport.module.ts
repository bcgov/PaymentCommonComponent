import { Logger, Module } from '@nestjs/common';
import { ExcelexportService } from './excelexport.service';

@Module({
  providers: [ExcelexportService, Logger],
  exports: [ExcelexportService]
})
export class ExcelexportModule {}
