import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PosDepositService } from './../../../src/deposits/pos-deposit.service';
import { LocationService } from './../../../src/location/location.service';
import { POSReconciliationService } from './../../../src/reconciliation/pos-reconciliation.service';
import { TransactionService } from './../../../src/transaction/transaction.service';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';
import { PaymentService } from '../../../src/transaction/payment.service';

describe('POSReconciliationService', () => {
  let service: POSReconciliationService;
  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };
  const mockedPaymentService = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({}))
  };

  const mockedTransactionService = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({}))
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POSReconciliationService,
        PosDepositService,
        LocationService,
        Logger,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: mockedRepo
        },
        {
          provide: TransactionService,
          useValue: mockedTransactionService
        },
        {
          provide: PaymentService,
          useValue: mockedPaymentService
        }
      ]
    }).compile();

    service = module.get<POSReconciliationService>(POSReconciliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
