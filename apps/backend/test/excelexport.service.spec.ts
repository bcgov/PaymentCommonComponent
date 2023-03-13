import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExcelexportService } from '../src/excelexport/excelexport.service';
import { S3ManagerService } from '../src/s3-manager/s3-manager.service';

describe('ExcelexportService', () => {
  let service: ExcelexportService;

  const s3ServiceMock = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelexportService,
        Logger,
        {
          provide: S3ManagerService,
          useValue: s3ServiceMock
        }
      ]
    }).compile();

    service = module.get<ExcelexportService>(ExcelexportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
