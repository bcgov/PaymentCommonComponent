import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LocationEntity } from './entities/master-location-data.entity';
import { LocationEnum } from './const';
import { Ministries } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>
  ) {}

  public async getPtLocationIdsByLocationId(
    location_id: number
  ): Promise<number[]> {
    const pt_ids = await this.locationRepo.find({
      where: {
        location_id: location_id,
        type: 'Visa' // Replace with select distinct
      }
    });
    return pt_ids?.map((itm: LocationEntity) => itm.merchant_id);
  }

  // TODO: Get Distinct Locations
  // Remove bank
  public async getLocationsBySource(
    source: Ministries
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      select: {
        location_id: true,
        description: true
      },
      where: {
        type: `${LocationEnum.Bank}`,
        source_id: source
      }
    });
  }
}
