import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MasterLocationEntity,
  BankLocationEntity,
  LocationEntity,
  MerchantLocationEntity,
} from './entities';
import { Ministries, BankMerchantId } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(MasterLocationEntity)
    private locationRepo: Repository<MasterLocationEntity>,
    @InjectRepository(LocationEntity)
    private ministryLocationRepo: Repository<LocationEntity>,
    @InjectRepository(BankLocationEntity)
    private bankLocationRepo: Repository<BankLocationEntity>,
    @InjectRepository(MerchantLocationEntity)
    private merchantLocationRepo: Repository<MerchantLocationEntity>
  ) {}

  public async findAll(): Promise<MasterLocationEntity[]> {
    return await this.locationRepo.find();
  }
  public async findBanks(): Promise<BankLocationEntity[]> {
    return await this.bankLocationRepo.find();
  }
  public async findMerchants(): Promise<MerchantLocationEntity[]> {
    return await this.merchantLocationRepo.find();
  }
  public async findMinistryLocations(
    program: Ministries
  ): Promise<LocationEntity[]> {
    return await this.ministryLocationRepo.find({
      where: { source_id: program },
      relations: ['banks', 'merchants'],
    });
  }

  public async seedMinistryLocations(
    locations: MasterLocationEntity[],
    program: Ministries
  ) {
    // master location data list contains multiple rows for each location_id
    // split into location table (FK to transaction table), location_merchant table (FK to location_id && pos-deposit), and location_bank table (FK to location_id && cash_deposit)
    const locationEntityList = locations.reduce(
      (
        acc: { [key: string]: Partial<LocationEntity> },
        itm: MasterLocationEntity
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
          !acc[key].merchants?.find((merch) => merch.id === itm.merchant_id) &&
          acc[key].merchants?.push(
            new MerchantLocationEntity({ id: itm.merchant_id })
          );

        !acc[key].banks?.find((pt) => pt.id === itm.pt_location_id) &&
          acc[key].banks?.push(
            new BankLocationEntity({ id: itm.pt_location_id })
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
        Object.values(locationEntityList).map((itm) => new LocationEntity(itm))
      )
    );
  }

  public async createLocations(
    locationsData: MasterLocationEntity[]
  ): Promise<void> {
    await this.locationRepo.save(this.locationRepo.create(locationsData));
  }
}
