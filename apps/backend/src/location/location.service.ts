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

  public async getMerchantIdsByLocationId(
    location_id: number
  ): Promise<number[]> {
    const merchantIds = await this.locationRepo.find({
      select: {
        merchant_id: true
      },
      where: {
        location_id: location_id,
      }
    });
    return merchantIds?.map((itm: LocationEntity) => itm.merchant_id);
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
