import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LocationMethod } from './const';
import { LocationEntity } from './entities';
import { MasterDataLocationEntity } from './entities/master-location-data.entity';
import { Ministries, BankMerchantId, NormalizedLocation } from '../constants';
import { PaymentMethodEntity } from '../transaction/entities';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(MasterDataLocationEntity)
    private masterLocationRepo: Repository<MasterDataLocationEntity>,
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>
  ) {}

  public async findAll(): Promise<LocationEntity[]> {
    return await this.locationRepo.find();
  }

  public async findAllMasterLocationsData(): Promise<
    MasterDataLocationEntity[]
  > {
    return await this.masterLocationRepo.find();
  }

  public async createLocations(
    locationsData: MasterDataLocationEntity[]
  ): Promise<void> {
    await this.masterLocationRepo.save(
      this.masterLocationRepo.create(locationsData)
    );
  }
  public async createNormalizedLocation(
    locations: LocationEntity[]
  ): Promise<void> {
    await this.locationRepo.save(this.locationRepo.create(locations));
  }
  public async getLocationsByID(
    program: Ministries,
    location_ids: number[]
  ): Promise<LocationEntity[]> {
    const locations = await this.locationRepo.find({
      where: {
        source_id: program,
        location_id: In(location_ids),
      },
      order: {
        location_id: 'ASC',
      },
    });
    return locations;
  }
  /**
   * Build a normalized location list from a list of locations in order to match the merchant ids to a single location id
   * @param locations
   * @returns
   */
  public normalizeLocations(
    locations: MasterDataLocationEntity[],
    paymentMethods: PaymentMethodEntity[]
  ): LocationEntity[] {
    const LocationEntityList = locations.reduce(
      (
        acc: {
          [key: string]: NormalizedLocation;
        },
        itm: MasterDataLocationEntity
      ) => {
        const key = itm.location_id + itm.source_id;
        if (!acc[key]) {
          acc[key] = {
            id: `${itm.source_id}_${itm.location_id}`,
            source_id: itm.source_id,
            location_id: itm.location_id,
            program_code: itm.program_code,
            ministry_client: itm.ministry_client,
            resp_code: itm.resp_code,
            service_line_code: itm.service_line_code,
            stob_code: itm.stob_code,
            project_code: itm.project_code,
            description: '',
            program_desc: itm.program_desc,
            pt_location_id: 0,
            merchant_ids: [],
          };
        }
        itm.merchant_id !== BankMerchantId &&
          acc[key].merchant_ids?.push({
            merchant_id: itm.merchant_id,
            source_id: itm.source_id,
            description: itm.description,
            location_id: itm.location_id,
            payment_method: paymentMethods.find(
              (pm) => pm.method === itm.method
            )!,
          });

        if (itm.method === LocationMethod.Bank) {
          acc[key].pt_location_id = itm.pt_location_id;
          acc[key].description = itm.description;
        }
        return acc;
      },
      {}
    );
    return Object.values(LocationEntityList).map(
      (itm) => new LocationEntity(itm, Array.from(new Set(itm.merchant_ids)))
    );
  }

  public async getLocationsBySource(
    source: Ministries
  ): Promise<LocationEntity[]> {
    const locations = await this.locationRepo.find({
      where: {
        source_id: source,
      },
      order: {
        location_id: 'ASC',
      },
      relations: ['merchant_ids', 'pt_location_ids'],
    });
    return locations;
  }
}
