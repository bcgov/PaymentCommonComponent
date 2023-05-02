import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';
import { LocationService } from '../../../src/location/location.service';
import { CashReconciliationService } from '../../../src/reconciliation/cash-reconciliation.service';
import { PaymentService } from '../../../src/transaction/payment.service';

//TODO WIP
jest.mock('../../../src/reconciliation/cash-reconciliation.service');
describe('CashReconciliationService', () => {
  let service: CashReconciliationService;

  const mockedRepo = {
    find: jest.fn(() => Promise.resolve({}))
  };

  const mockedPaymentService = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    // reconcileCash = jest.fn(() => reconcileCash as jest.Mock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashReconciliationService,
        CashDepositService,
        LocationService,
        Logger,
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: mockedRepo
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: {
            find: jest.fn(() => Promise.resolve([]))
          }
        },
        {
          provide: PaymentService,
          useValue: mockedPaymentService
        }
      ]
    }).compile();

    service = module.get<CashReconciliationService>(CashReconciliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
