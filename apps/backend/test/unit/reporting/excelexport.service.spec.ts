import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExcelExportService } from '../../../src/excelexport/excelexport.service';
import { S3ManagerService } from '../../../src/s3-manager/s3-manager.service';

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  const s3ServiceMock = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelExportService,
        Logger,
        {
          provide: S3ManagerService,
          useValue: s3ServiceMock
        }
      ]
    }).compile();

    service = module.get<ExcelExportService>(ExcelExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
