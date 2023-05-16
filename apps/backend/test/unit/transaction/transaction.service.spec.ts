import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionEntity } from '../../../src/transaction/entities';
import { PaymentService } from '../../../src/transaction/payment.service';
import { TransactionService } from '../../../src/transaction/transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({})),
  };

  const mockedPaymentService = {
    // mock the query method that is used
    query: jest.fn(() => Promise.resolve({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        Logger,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: mockedRepo,
        },
        {
          provide: PaymentService,
          useValue: mockedPaymentService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
