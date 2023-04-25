import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { In, Raw, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentMethodEntity } from './../transaction/entities/payment-method.entity';

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
    const merchant_ids: number[] =
      await this.locationService.getMerchantIdsByLocationId(
        location.location_id
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
      relations: {
        payment_method: true
      },
      // Order by needs to be in this order for matching logic.
      // We need to batch them using order to ease matches
      order: {
        transaction_amt: 'ASC',
        payment_method: { method: 'ASC' },
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

  async findPOSBySettlementDate(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ) {
    const merchant_ids = await this.locationService.getMerchantIdsByLocationId(
      location.location_id
    );
    const { to_date, from_date } = dateRange;
    const qb = this.posDepositRepo.createQueryBuilder('pos_deposit');

    qb.select(['settlement_date::date']);
    qb.addSelect('payment_method.description', 'payment_method');
    qb.addSelect(
      'SUM(transaction_amt)::numeric(10,2)',
      'transaction_amt'
    ).leftJoin(
      PaymentMethodEntity,
      'payment_method',
      'payment_method.method = pos_deposit.payment_method'
    );
    qb.where({
      metadata: { program },
      merchant_id: In([...merchant_ids]),
      settlement_date: Raw(
        (alias) =>
          `${alias} >= :from_date::date and ${alias} <= :to_date::date`,
        { from_date, to_date }
      )
    });

    qb.groupBy('settlement_date');
    qb.addGroupBy('terminal_no');
    qb.addGroupBy('payment_method');
    qb.addGroupBy('payment_method.method');
    qb.orderBy({
      settlement_date: 'ASC',
      transaction_amt: 'ASC',
      terminal_no: 'ASC'
    });

    const deposits = await qb.getRawMany();
    return deposits.map((d) => ({
      ...d,
      settlement_date: format(new Date(d.settlement_date), 'yyyy-MM-dd')
    }));
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

  async updateDeposits(
    deposits: POSDepositEntity[]
  ): Promise<POSDepositEntity[]> {
    return await Promise.all(deposits.map((itm) => this.update(itm)));
  }

  async update(deposit: POSDepositEntity): Promise<POSDepositEntity> {
    return await this.posDepositRepo.save(deposit);
  }
}
