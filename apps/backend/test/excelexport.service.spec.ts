import { Test, TestingModule } from '@nestjs/testing';
import { ExcelexportService } from '../src/excelexport/excelexport.service';

describe('ExcelexportService', () => {
  let service: ExcelexportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelexportService],
    }).compile();

    service = module.get<ExcelexportService>(ExcelexportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
