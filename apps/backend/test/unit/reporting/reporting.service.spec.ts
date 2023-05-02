import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashDepositService } from './../../../src/deposits/cash-deposit.service';
import { POSDepositEntity } from './../../../src/deposits/entities/pos-deposit.entity';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { ExcelExportService } from './../../../src/excelexport/excelexport.service';
import { LocationEntity } from './../../../src/location/entities/master-location-data.entity';
import { LocationService } from './../../../src/location/location.service';
import { DetailedReportService } from './../../../src/reporting/details-report.service';
import { S3ManagerService } from './../../../src/s3-manager/s3-manager.service';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { PaymentService } from './../../../src/transaction/payment.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { ReportingService } from '../../../src/reporting/reporting.service';
import { PaymentMethodEntity } from '../../../src/transaction/entities';

describe('ReportingService', () => {
  let service: ReportingService;

  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };
  const s3ServiceMock = {
    query: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        DetailedReportService,
        LocationService,
        PaymentService,
        CashDepositService,
        PosDepositService,
        PaymentService,
        ExcelExportService,
        Logger,
        {
          provide: S3ManagerService,
          useValue: s3ServiceMock
        },
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(PaymentMethodEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: mockedRepo
        }
      ]
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
