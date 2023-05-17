import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { LocationEnum, LocationMethod } from './const';
import { LocationEntity } from './entities/master-location-data.entity';
import { Ministries } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>
  ) {}

  public async getLocationsByID(
    program: Ministries,
    location_ids: number[],
    method: LocationMethod
  ): Promise<LocationEntity[]> {
    const locationMethod =
      method === LocationMethod.Bank
        ? LocationMethod.Bank
        : Not(LocationMethod.Bank);
    return await this.locationRepo.find({
      select: {
        location_id: true,
        pt_location_id: true,
        description: true,
      },
      where: {
        source_id: program,
        method: locationMethod,
        location_id: In(location_ids),
      },
      order: {
        location_id: 'ASC',
      },
    });
  }

  public async getLocationsBySource(
    source: Ministries
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      where: {
        source_id: source,
        method: `${LocationEnum.Bank}`,
      },
      order: {
        location_id: 'ASC',
      },
    });
  }
}
