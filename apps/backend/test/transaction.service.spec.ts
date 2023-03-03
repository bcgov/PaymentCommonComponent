import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentEntity } from '../src/transaction/entities/payment.entity';
import { TransactionEntity } from '../src/transaction/entities/transaction.entity';
import { TransactionService } from '../src/transaction/transaction.service';
import { PaymentService } from './../src/transaction/payment.service';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        PaymentService,
        Logger,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: {}
        },
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: {}
        }
      ]
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
