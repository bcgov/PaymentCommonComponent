import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LocationMethod } from './const';
import { LocationEntity } from './entities/master-location-data.entity';
import { Ministries, NormalizedLocation, BankMerchantId } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>
  ) {}
  public async findAll(): Promise<LocationEntity[]> {
    return await this.locationRepo.find();
  }

  public async createLocations(locationsData: LocationEntity[]): Promise<void> {
    await this.locationRepo.save(this.locationRepo.create(locationsData));
  }
  public async getLocationsByID(
    program: Ministries,
    location_ids: number[]
  ): Promise<NormalizedLocation[]> {
    const locations = await this.locationRepo.find({
      where: {
        source_id: program,
        location_id: In(location_ids),
      },
      order: {
        location_id: 'ASC',
      },
    });
    return this.normalizeLocations(locations);
  }
  /**
   * Build a normalized location list from a list of locations in order to match the merchant ids to a single location id
   * @param locations
   * @returns
   */
  public normalizeLocations(locations: LocationEntity[]): NormalizedLocation[] {
    const normalizedLocationList = locations.reduce(
      (acc: { [key: string]: NormalizedLocation }, itm: LocationEntity) => {
        const key = itm.location_id;
        if (!acc[key]) {
          acc[key] = {
            source_id: itm.source_id,
            location_id: itm.location_id,
            program_code: itm.program_code,
            ministry_client: itm.ministry_client,
            resp_code: itm.resp_code,
            service_line_code: itm.service_line_code,
            stob_code: itm.stob_code,
            project_code: itm.project_code,
            merchant_ids: [],
            pt_location_id: 0,
            description: '',
          };
        }
        itm.merchant_id !== BankMerchantId &&
          acc[key].merchant_ids.push(itm.merchant_id);
        if (itm.method === LocationMethod.Bank) {
          acc[key].pt_location_id = itm.pt_location_id;
          acc[key].description = itm.description;
        }
        return acc;
      },
      {}
    );
    return Object.values(normalizedLocationList);
  }

  public async getLocationsBySource(
    source: Ministries
  ): Promise<NormalizedLocation[]> {
    const locations = await this.locationRepo.find({
      where: {
        source_id: source,
      },
      order: {
        location_id: 'ASC',
      },
    });
    return this.normalizeLocations(locations);
  }
}
