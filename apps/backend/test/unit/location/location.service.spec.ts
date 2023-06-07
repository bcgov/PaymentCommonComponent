import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { locations } from './../../mocks/const/locations';
import { Ministries } from '../../../src/constants';
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
    const location_ids = [1];

    const locationRepoSpy = jest
      .spyOn(locationRepo, 'find')
      .mockResolvedValue(locations.filter((itm) => itm.location_id === 1));

    await service.getLocationsByID(Ministries.SBC, location_ids);

    expect(locationRepoSpy).toBeCalledWith({
      where: {
        source_id: Ministries.SBC,
        location_id: In(location_ids),
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

    const locationRepoSpy = jest
      .spyOn(locationRepo, 'find')
      .mockResolvedValue(expectedResultFromRepo);

    const result = await service.getLocationsBySource(source);
    expect(result).toEqual(service.normalizeLocations(expectedResultFromRepo));
    expect(locationRepoSpy).toBeCalledWith({
      where: {
        source_id: source,
      },
      order: {
        location_id: 'ASC',
      },
    });
  });
});
