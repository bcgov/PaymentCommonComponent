import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { LocationService } from '../location/location.service';
import { ReconciliationEvent } from '../reconciliation/const';
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
    const merchant_ids =
      await this.locationService.getPtLocationIdsByLocationId(
        event?.location_id || 0
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
      }
    });
    // return await this.posDepositRepo.manager.query(`
    // SELECT
    //   pd.id,
    //   pd.transaction_amt,
    //   pd.match,
    //   pd.card_vendor,
    //   pd.transaction_date::varchar,
    //   pd.transaction_time::varchar,
    //   pm.method as method
    // FROM
    //   pos_deposit pd
    // JOIN
    //   payment_method pm
    // ON
    //   pm.method=pd.card_vendor
    // WHERE
    //   transaction_date='${event?.date}'::date
    // AND
    //   pd.program='${event?.program}'
    // AND
    //   pd.merchant_id IN (
    //     SELECT
    //       merchant_id
    //     FROM
    //       master_location_data
    //   WHERE
    //     location_id=${event?.location_id}
    //   AND "type"
    //     !='Bank'
    //   )
    // ORDER BY
    //   pd.transaction_date
    // DESC
    // `);
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

  // TODO: This should be name markPosDepositAsMatchedById(pos_id, payment_id)
  // TODO: we also need these: markCashDepositAsMarchedById(cash_id, payment_id), markPaymentAsMatchedById(payment_id, deposit_id)
  // TODO: update this query to just update the match column.

  async updatePOSDepositEntity(
    deposit: Partial<POSDepositEntity>,
    payment: Partial<PaymentEntity>
  ): Promise<POSDepositEntity> {
    const depositEntity = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    depositEntity.match = true;
    depositEntity.matched_payment_id = `${payment.id}`;
    return await this.posDepositRepo.save(depositEntity);
  }
}
