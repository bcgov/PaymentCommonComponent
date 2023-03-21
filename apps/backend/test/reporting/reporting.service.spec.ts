import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { POSDepositEntity } from './../../src/deposits/entities/pos-deposit.entity';
import { PaymentEntity } from './../../src/transaction/entities/payment.entity';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';
import { ReportingService } from '../../src/reporting/reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;

  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        Logger,
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
        }
      ]
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
