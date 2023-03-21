import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashDepositService } from '../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';

describe('CashDepositService', () => {
  let service: CashDepositService;
  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashDepositService,
        Logger,
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: mockedRepo
        }
      ]
    }).compile();

    service = module.get<CashDepositService>(CashDepositService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
