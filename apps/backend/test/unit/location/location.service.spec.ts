import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationEntity } from '../../../src/location/entities';
import { LocationService } from '../../../src/location/location.service';

describe('LocationService', () => {
  let service: LocationService;

  const mockedRepo = {
    findOneOrFail: jest.fn(() => Promise.resolve({}))
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        Logger,
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: mockedRepo
        }
      ]
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
