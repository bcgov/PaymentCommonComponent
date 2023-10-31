import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LocationMethod } from './const';
import {
  MinistryLocationEntity,
  BankLocationEntity,
  LocationEntity,
  MerchantEntity,
} from './entities';
import { Ministries, BankMerchantId, NormalizedLocation } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>,
    @InjectRepository(MinistryLocationEntity)
    private ministryLocationRepo: Repository<MinistryLocationEntity>,
    @InjectRepository(BankLocationEntity)
    private bankLocationRepo: Repository<BankLocationEntity>,
    @InjectRepository(MerchantEntity)
    private merchantLocationRepo: Repository<MerchantEntity>
  ) {}

  public async findAll(): Promise<LocationEntity[]> {
    return await this.locationRepo.find();
  }
  public async findBanks(): Promise<BankLocationEntity[]> {
    return await this.bankLocationRepo.find();
  }
  public async findMerchants(): Promise<MerchantEntity[]> {
    return await this.merchantLocationRepo.find();
  }
  public async findMinistryLocations(
    program: Ministries
  ): Promise<MinistryLocationEntity[]> {
    return await this.ministryLocationRepo.find({
      where: { source_id: program },
      relations: ['banks', 'merchants'],
    });
  }
  /**
   * Splits the masterlocation data table in three tables: location, bank, and merchant
   * @param locations
   * @param program
   */
  public async seedMinistryLocations(
    locations: LocationEntity[],
    program: Ministries
  ) {
    const locationEntityList = locations.reduce(
      (
        acc: { [key: string]: Partial<MinistryLocationEntity> },
        itm: LocationEntity
      ) => {
        const key = `${itm.location_id}${itm.source_id}`;
        if (!acc[key]) {
          acc[key] = {
            source_id: itm.source_id,
            location_id: itm.location_id,
            program_code: itm.program_code,
            program_desc: itm.program_desc,
            ministry_client: itm.ministry_client,
            resp_code: itm.resp_code,
            service_line_code: itm.service_line_code,
            stob_code: itm.stob_code,
            project_code: itm.project_code,
            banks: [],
            merchants: [],
            description: '',
          };
        }

        itm.merchant_id !== BankMerchantId &&
          !acc[key].merchants?.find(
            (merch) => merch.merchant_id === itm.merchant_id
          ) &&
          acc[key].merchants?.push(
            new MerchantEntity({ merchant_id: itm.merchant_id })
          );

        !acc[key].banks?.find((pt) => pt.bank_id === itm.pt_location_id) &&
          acc[key].banks?.push(
            new BankLocationEntity({
              bank_id: itm.pt_location_id,
              method: itm.method,
            })
          );
        if (program === 'SBC') {
          acc[key].description = locations.find(
            (loc) =>
              loc.location_id === itm.location_id && loc.method === 'Bank'
          )!.description;
        } else {
          acc[key].description = itm.description;
        }

        return acc;
      },
      {}
    );
    await this.ministryLocationRepo.save(
      this.ministryLocationRepo.create(
        Object.values(locationEntityList).map((itm) => itm)
      )
    );
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
