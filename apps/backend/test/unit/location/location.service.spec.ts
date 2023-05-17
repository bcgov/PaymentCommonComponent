import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { locations, normalizedLocations } from './../../mocks/const/locations';
import { Ministries } from '../../../src/constants';
import { LocationMethod } from '../../../src/location/const';
import { LocationEntity } from '../../../src/location/entities';
import { LocationService } from '../../../src/location/location.service';

describe('LocationService', () => {
  let service: LocationService;
  let locationRepo: Repository<LocationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    locationRepo = module.get<Repository<LocationEntity>>(
      getRepositoryToken(LocationEntity)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('get merchant ids by location_id', async () => {
    const location_id = 1;
    const expectedResult = normalizedLocations.filter(
      (location) => location.location_id === location_id
    );

    const locationRepoSpy = jest
      .spyOn(locationRepo, 'find')
      .mockResolvedValue(expectedResult);
    const result = await service.getLocationsByID(
      Ministries.SBC,
      [location_id],
      LocationMethod.POS
    );
    expect(result).toEqual(expectedResult);
    expect(locationRepoSpy).toBeCalledWith({
      where: {
        location_id: In([location_id]),
        source_id: Ministries.SBC,
        method: Not(LocationMethod.Bank),
      },
      order: {
        location_id: 'ASC',
      },
    });
  });
  it('should get locations by source', async () => {
    const source = Ministries.SBC;
    const expectedResult = locations.filter(
      (location) => location.source_id === source
    );
    const locationRepoSpy = jest
      .spyOn(locationRepo, 'find')
      .mockResolvedValue(expectedResult);
    const result = await service.getLocationsBySource(source);
    expect(result).toEqual(expectedResult);
    expect(locationRepoSpy).toBeCalledWith({
      where: {
        source_id: source,
        method: `${LocationMethod.Bank}`,
      },
      order: {
        location_id: 'ASC',
      },
    });
  });
});
