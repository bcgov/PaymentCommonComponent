import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { In, LessThan, Raw, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import { LocationMethod } from '../location/const';
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

  async findPosDeposits(
    dateRange: DateRange,
    program: Ministries,
    location_ids: number[],
    statuses?: MatchStatus[]
  ): Promise<POSDepositEntity[]> {
    const depositStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;
    const locations: LocationEntity[] =
      await this.locationService.getLocationsByID(
        program,
        location_ids,
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
    location_id: number,
    program: Ministries
  ): Promise<POSDepositEntity[]> {
    // Get all corresponding locations for a location id and program
    const locations = await this.locationService.getLocationsByID(
      program,
      [location_id],
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
    location_id: number,
    program: Ministries,
    dateRange: DateRange
  ) {
    // Get all corresponding locations for a location id and program
    const locations = await this.locationService.getLocationsByID(
      program,
      [location_id],
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

  /**
   * MatcDeposits
   * This will match necessary deposits. This should be more performant as it is wrapped in a transaction
   * @param deposits A list of deposit entities that we are set to "Match", with the new heuristic round
   * @returns {void}
   */
  async matchDeposits(deposits: POSDepositEntity[]): Promise<void> {
    return this.posDepositRepo.manager.transaction(async (manager) => {
      await Promise.all(
        deposits.map((d) => {
          const { timestamp, ...dep } = d;
          return manager.update(
            POSDepositEntity,
            { id: dep.id },
            {
              ...dep,
              status: MatchStatus.MATCH,
              heuristic_match_round: dep.heuristic_match_round,
            }
          );
        })
      );
      return;
    });
  }
}
