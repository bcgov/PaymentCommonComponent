import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { locations } from './../../mocks/const/locations';
import { Ministries } from '../../../src/constants';
import {
  MinistryLocationEntity,
  LocationEntity,
  BankLocationEntity,
  MerchantEntity,
} from '../../../src/location/entities';
import { LocationService } from '../../../src/location/location.service';
import { LoggerModule } from '../../../src/logger/logger.module';

describe('LocationService', () => {
  let service: LocationService;
  let ministryLocation: Repository<LocationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(MinistryLocationEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MerchantEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BankLocationEntity),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    ministryLocation = module.get<Repository<LocationEntity>>(
      getRepositoryToken(LocationEntity)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('get merchants by location_id', async () => {
    // TODO: fix this test
    // const location_ids = [1];

    const locationSpy = jest
      .spyOn(ministryLocation, 'find')
      .mockResolvedValue(locations.filter((itm) => itm.location_id === 1));

    await service.getLocationsBySource(Ministries.SBC);

    expect(locationSpy).toBeCalledWith({
      where: {
        source_id: Ministries.SBC,
      },
      order: {
        location_id: 'ASC',
      },
    });
  });
  it('should get locations by source', async () => {
    const source = Ministries.SBC;
    const expectedResultFromRepo = locations.filter(
      (location) => location.source_id === source
    );

    const ministryLocationSpy = jest
      .spyOn(ministryLocation, 'find')
      .mockResolvedValue(expectedResultFromRepo);

    await service.getLocationsBySource(Ministries.SBC);
    expect(ministryLocationSpy).toBeCalledWith({
      where: {
        source_id: Ministries.SBC,
      },
      order: {
        location_id: 'ASC',
      },
    });
  });
});
