import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { LocationEnum } from './const';
import { LocationEntity } from './entities/master-location-data.entity';
import { Ministries } from '../constants';
import { ReconciliationEventInput } from '../reconciliation/types';

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
        location_id,
        method: Not('Bank')
      },
      order: {
        location_id: 'ASC'
      }
    });
    return merchant_ids.map((itm) => itm.merchant_id) as number[];
  }

  public async getPTLocationsByID(
    event: ReconciliationEventInput
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      select: {
        pt_location_id: true,
        description: true
      },
      where: {
        source_id: event.program,
        method: `${LocationEnum.Bank}`,
        pt_location_id: In(event.location_ids)
      },
      order: {
        pt_location_id: 'ASC'
      }
    });
  }

  public async getPTLocationsBySource(
    source: Ministries
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      where: {
        source_id: source,
        method: `${LocationEnum.Bank}`
      },
      order: {
        location_id: 'ASC'
      }
    });
  }
  public async getLocationsByID(
    event: ReconciliationEventInput
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      select: {
        location_id: true,
        description: true
      },
      where: {
        source_id: event.program,
        method: `${LocationEnum.Bank}`,
        location_id: In(event.location_ids)
      },
      order: {
        location_id: 'ASC'
      }
    });
  }

  public async getLocationsBySource(
    source: Ministries
  ): Promise<LocationEntity[]> {
    return await this.locationRepo.find({
      where: {
        source_id: source,
        method: `${LocationEnum.Bank}`
      },
      order: {
        location_id: 'ASC'
      }
    });
  }
}
