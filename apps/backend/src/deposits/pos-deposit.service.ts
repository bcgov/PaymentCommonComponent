import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus } from '../common/const';
import { mapLimit } from '../common/promises';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import {
  ReconciliationEvent,
  PosPaymentPosDepositPair
} from '../reconciliation/types';

@Injectable()
export class PosDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(LocationService)
    private locationService: LocationService,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>
  ) {}

  findAll(): Promise<POSDepositEntity[]> {
    return this.findAll();
  }

  async findPOSDeposits(
    event: ReconciliationEvent
  ): Promise<POSDepositEntity[]> {
    const merchant_ids = await Promise.all(
      await this.locationService.getMerchantIdsByLocationId(
        event.location.location_id
      )
    );
    return await this.posDepositRepo.find({
      where: {
        transaction_date: event?.date,
        metadata: {
          program: event?.program
        },
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

  async markPosDepositsAsMatched(
    posPaymentDepostPair: PosPaymentPosDepositPair[]
  ): Promise<POSDepositEntity[]> {
    return await Promise.all(
      posPaymentDepostPair.map(async (pair) => {
        const depositEntity = await this.posDepositRepo.findOneByOrFail({
          id: pair.deposit.id
        });
        depositEntity.status = MatchStatus.MATCH;
        return await this.posDepositRepo.save(depositEntity);
      })
    );
  }

  async markPosDepositAsException(
    deposit: POSDepositEntity
  ): Promise<POSDepositEntity> {
    const depositEntity = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    depositEntity.status = MatchStatus.EXCEPTION;
    return await this.posDepositRepo.save(depositEntity);
  }
}
