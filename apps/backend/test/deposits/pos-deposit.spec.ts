import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { POSDepositEntity } from './../../src/deposits/entities/pos-deposit.entity';
import { LocationEntity } from './../../src/location/entities/master-location-data.entity';
import { PosDepositService } from '../../src/deposits/pos-deposit.service';
import { LocationService } from '../../src/location/location.service';

describe('POSDepositService', () => {
  let service: PosDepositService;
  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
        }
      ]
    }).compile();

    service = module.get<PosDepositService>(PosDepositService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
