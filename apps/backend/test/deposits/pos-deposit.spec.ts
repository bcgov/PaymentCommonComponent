import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { POSDepositEntity } from './../../src/deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../../src/deposits/pos-deposit.service';

describe('POSDepositService', () => {
  let service: PosDepositService;
  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDepositService,
        Logger,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: mockedRepo
        }
      ]
    }).compile();

    service = module.get<PosDepositService>(PosDepositService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
