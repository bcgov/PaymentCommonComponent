import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { LocationEnum } from './const';
import { LocationEntity } from './entities/master-location-data.entity';
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
    const merchant_ids = await this.locationRepo.find({
      select: {
        merchant_id: true
      },
      where: {
        location_id: location_id,
        method: Not('Bank')
      },
      order: {
        location_id: 'ASC'
      }
    });
    return merchant_ids.map((itm) => itm.merchant_id) as number[];
  }

  public async getLocationsBySource(source: Ministries): Promise<number[]> {
    const locations = await this.locationRepo.find({
      select: {
        location_id: true
      },
      where: {
        source_id: source,
        method: `${LocationEnum.Bank}`
      },
      order: {
        location_id: 'ASC'
      }
    });
    return locations.map((itm) => itm.location_id) as number[];
  }
}
