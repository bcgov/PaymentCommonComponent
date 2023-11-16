import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  MinistryLocationEntity,
  BankLocationEntity,
  MasterLocationEntity,
  MerchantEntity,
} from './entities';
import { BankMerchantId, Ministries } from '../constants';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(MasterLocationEntity)
    private locationRepo: Repository<MasterLocationEntity>,
    @InjectRepository(MinistryLocationEntity)
    private ministryLocationRepo: Repository<MinistryLocationEntity>,
    @InjectRepository(BankLocationEntity)
    private bankLocationRepo: Repository<BankLocationEntity>,
    @InjectRepository(MerchantEntity)
    private merchantLocationRepo: Repository<MerchantEntity>
  ) {}

  public async findAll(): Promise<MasterLocationEntity[]> {
    return this.locationRepo.find();
  }
  public async findBanks(): Promise<BankLocationEntity[]> {
    return this.bankLocationRepo.find();
  }
  public async findMerchants(): Promise<MerchantEntity[]> {
    return this.merchantLocationRepo.find();
  }
  public async quickFindBySource(
    program: Ministries
  ): Promise<MinistryLocationEntity[]> {
    return await this.ministryLocationRepo.find({
      where: {
        source_id: program,
      },
    });
  }
  public async findAllMinistryLocations(): Promise<MinistryLocationEntity[]> {
    return this.ministryLocationRepo.find({
      relations: ['banks', 'merchants'],
    });
  }
  /**
   * find the locations for a specific minstry client
   * includes the banks and merchants
   * @param program
   * @returns
   */
  public async findMinistryLocations(
    program: Ministries
  ): Promise<MinistryLocationEntity[]> {
    return this.ministryLocationRepo.find({
      where: { source_id: program },
      // relations: ['banks', 'merchants'],
    });
  }
  /**
   * Splits the masterlocation data table in three tables: location, bank, and merchant
   * @param locations
   * @param program
   */
  public async seedMinistryLocations(
    locations: MasterLocationEntity[],
    program: Ministries
  ) {
    const MasterLocationEntityList = locations.reduce(
      (
        acc: { [key: string]: Partial<MinistryLocationEntity> },
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
    await Promise.all(
      await this.ministryLocationRepo.save(
        this.ministryLocationRepo.create(
          Object.values(MasterLocationEntityList).map((itm) => itm)
        )
      )
    );
  }
  /**
   * create new location entities
   * @param locationsData
   */
  public async createLocations(
    locationsData: MasterLocationEntity[]
  ): Promise<void> {
    await this.locationRepo.save(this.locationRepo.create(locationsData));
  }
  /**
   * finds all ministry locations belonging to a ministry-client  by id
   * @param program  ministry-client
   * @param location_ids location_ids from the location/txn table
   * @returns
   */
  public async getLocationsByID(
    program: Ministries,
    location_ids: number[]
  ): Promise<MinistryLocationEntity[]> {
    return this.ministryLocationRepo.find({
      where: {
        source_id: program,
        location_id: In(location_ids),
      },
      order: {
        location_id: 'ASC',
      },
    });
  }
  /**
   * finds all minstry locations belonging to a ministry-client
   * @param source Ministries enum
   * @returns
   */
  public async getLocationsBySource(
    source: Ministries
  ): Promise<MinistryLocationEntity[]> {
    return this.ministryLocationRepo.find({
      where: {
        source_id: source,
      },
      order: {
        location_id: 'ASC',
      },
    });
  }
  /**
   * finds a single ministry location without the id
   * @param location_id the location id
   * @param source_id the ministry-client
   * @returns
   */
  public async findLocation(
    location_id: number,
    source_id: string
  ): Promise<MinistryLocationEntity> {
    return this.ministryLocationRepo.findOneOrFail({
      where: {
        source_id,
        location_id,
      },
    });
  }
  /**
   * Creates a stub location for a ministry-client if the location is not found, but is submitted in the txn data
   * @param location_id  location_id from txn file
   * @param source_id  source_id from txn file
   * @returns stub location
   */
  public async createLocation(
    location: Partial<MinistryLocationEntity>
  ): Promise<MinistryLocationEntity> {
    return await this.ministryLocationRepo.save(
      this.ministryLocationRepo.create(location)
    );
  }
}
