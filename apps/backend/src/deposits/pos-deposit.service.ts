import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { LocationMethod } from 'src/location/const';
import { In, LessThan, Raw, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentMethodEntity } from '../transaction/entities/payment-method.entity';

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
    dateRange: DateRange,
    program: Ministries,
    location: LocationEntity,
    statuses?: MatchStatus[]
  ): Promise<POSDepositEntity[]> {
    const depositStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;
    const locations: LocationEntity[] =
      await this.locationService.getLocationsByID(
        program,
        [location.location_id],
        LocationMethod.POS
      );

    return await this.posDepositRepo.find({
      where: {
        transaction_date: Raw(
          (alias) => `${alias} >= :minDate AND ${alias} <= :maxDate`,
          { minDate, maxDate }
        ),
        metadata: {
          program: program,
        },
        status: In(depositStatuses),
        merchant_id: In(locations.map((itm) => itm.merchant_id)),
      },
      relations: {
        payment_method: true,
      },
      // Order by needs to be in this order for matching logic.
      // We need to batch them using order to ease matches
      order: {
        transaction_date: 'ASC',
        transaction_time: 'ASC',
        transaction_amt: 'ASC',
        payment_method: { method: 'ASC' },
      },
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

  async findPOSDepositsExceptions(
    date: string,
    location: LocationEntity,
    program: Ministries
  ): Promise<POSDepositEntity[]> {
    const locations = await this.locationService.getLocationsByID(
      program,
      [location.location_id],
      LocationMethod.POS
    );
    return await this.posDepositRepo.find({
      where: {
        transaction_date: LessThan(date),
        status: MatchStatus.IN_PROGRESS,
        merchant_id: In(locations.map((itm) => itm.merchant_id)),
        metadata: { program },
      },
    });
  }

  async findPOSBySettlementDate(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ) {
    const locations = await this.locationService.getLocationsByID(
      program,
      [location.location_id],
      LocationMethod.POS
    );
    const { minDate, maxDate } = dateRange;
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
      merchant_id: In(locations.map((itm) => itm.merchant_id)),
      settlement_date: Raw(
        (alias) => `${alias} >= :minDate::date and ${alias} <= :maxDate::date`,
        { minDate, maxDate }
      ),
    });

    qb.groupBy('settlement_date');
    qb.addGroupBy('terminal_no');
    qb.addGroupBy('payment_method');
    qb.addGroupBy('payment_method.method');
    qb.orderBy({
      settlement_date: 'ASC',
      transaction_amt: 'ASC',
      terminal_no: 'ASC',
    });

    const deposits = await qb.getRawMany();
    return deposits.map((d) => ({
      ...d,
      settlement_date: format(new Date(d.settlement_date), 'yyyy-MM-dd'),
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
    return await this.posDepositRepo.save(deposits);
  }

  async update(deposit: POSDepositEntity): Promise<POSDepositEntity> {
    return await this.posDepositRepo.save(deposit);
  }
}
