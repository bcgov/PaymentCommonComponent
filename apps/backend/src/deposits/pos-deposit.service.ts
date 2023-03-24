import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { Ministries } from '../constants';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class PosDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(LocationService)
    private locationService: LocationService,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>
  ) {}

  async findPOSDeposits(
    date: string,
    program: Ministries,
    location: LocationEntity,
    status?: MatchStatus
  ): Promise<POSDepositEntity[]> {
    const depositStatus = status ? status : In(MatchStatusAll);
    const merchant_ids = await Promise.all(
      await this.locationService.getMerchantIdsByLocationId(
        location.location_id
      )
    );
    return await this.posDepositRepo.find({
      where: {
        transaction_date: date,
        metadata: {
          program: program
        },
        status: depositStatus,
        merchant_id: In(merchant_ids)
      },
      relations: ['payment_method'],
      // Order by needs to be in this order for matching logic.
      // We need to batch them using order to ease matches
      order: {
        transaction_amt: 'ASC',
        card_vendor: 'ASC',
        transaction_time: 'ASC'
      }
    });
  }

  async findAllUploadedFiles(): Promise<
    { pos_deposit_source_file_name: string }[]
  > {
    return this.posDepositRepo
      .createQueryBuilder('pos_deposit')
      .select('pos_deposit.metadata.source_file_name')
      .distinct()
      .getRawMany();
  }

  async savePOSDepositEntities(
    data: POSDepositEntity[]
  ): Promise<POSDepositEntity[]> {
    try {
      const entities = data.map((d) => this.posDepositRepo.create(d));
      return mapLimit(entities, (entity) => this.posDepositRepo.save(entity));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  async update(deposit: POSDepositEntity) {
    const depositEntity = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    return await this.posDepositRepo.save({ ...depositEntity, ...deposit });
  }
}
