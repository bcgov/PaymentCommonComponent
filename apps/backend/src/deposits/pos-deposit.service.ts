import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus } from '../common/const';
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
    const merchant_ids = await this.locationService.getMerchantIdsByLocationId(
      event?.location_id
    ); // TODO: Fix || 0
    return await this.posDepositRepo.find({
      relationLoadStrategy: 'query',
      relations: {
        payment_method: true
      },
      where: {
        transaction_date: event?.date,
        metadata: {
          program: event?.program
        },
        merchant_id: In(merchant_ids)
      },
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

  async createPOSDepositEntity(
    data: POSDepositEntity
  ): Promise<POSDepositEntity> {
    return await this.posDepositRepo.save(this.posDepositRepo.create(data));
  }

  // TODO: update this query to just update the match column.
  async markPosDepositsAsMatched(
    posPaymentDepostPair: PosPaymentPosDepositPair[]
  ): Promise<POSDepositEntity[]> {
    return await Promise.all(
      posPaymentDepostPair.map(async (pair) => {
        const depositEntity = await this.posDepositRepo.findOneByOrFail({
          id: pair.deposit.id
        });
        depositEntity.status = MatchStatus.MATCH;
        depositEntity.payment_id = pair.payment.id;
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
