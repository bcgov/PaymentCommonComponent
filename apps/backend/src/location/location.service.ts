import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
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
        merchant_id: true,
      },
      where: {
        location_id,
        method: Not('Bank'),
      },
      order: {
        location_id: 'ASC',
      },
    });
    return merchant_ids.map((itm) => itm.merchant_id) as number[];
  }

  public async getLocationsByID(
    program: Ministries,
    location_ids: number[]
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      select: {
        location_id: true,
        pt_location_id: true,
        description: true,
      },
      where: {
        source_id: program,
        method: `${LocationEnum.Bank}`,
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
