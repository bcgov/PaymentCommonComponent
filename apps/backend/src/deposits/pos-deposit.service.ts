import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, parse, addBusinessDays, subBusinessDays } from 'date-fns';
import { Between, In, LessThan, Raw, Repository } from 'typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries, NormalizedLocation } from '../constants';
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
    merchant_ids: number[],
    statuses?: MatchStatus[],
    payment_match = false
  ): Promise<POSDepositEntity[]> {
    const depositStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;

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
        merchant_id: In(merchant_ids),
      },
      relations: {
        payment_method: true,
        payment_match,
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

  /**
   * findPOSDepositsExceptions - Finds all deposits to mark as exceptions
   * @param maxDate
   * @param location
   * @returns
   */
  async findPOSDepositsExceptions(
    date: string,
    merchant_ids: number[],
    program: Ministries
  ): Promise<POSDepositEntity[]> {
    return await this.posDepositRepo.find({
      where: {
        transaction_date: LessThan(date),
        status: MatchStatus.IN_PROGRESS,
        merchant_id: In(merchant_ids),
        metadata: { program },
      },
    });
  }

  async findPOSBySettlementDate(
    locations: NormalizedLocation[],
    program: Ministries,
    dateRange: DateRange
  ) {
    // Get all corresponding locations for a location id and program

    const { minDate, maxDate } = dateRange;
    const qb = this.posDepositRepo.createQueryBuilder('pos_deposit');
    qb.select(['settlement_date::date']);
    qb.addSelect('payment_method', 'payment_method');
    qb.addSelect('SUM(transaction_amt)::numeric(10,2)', 'transaction_amt');
    qb.addSelect('location_id');
    qb.leftJoin(
      LocationEntity,
      'master_location_data',
      'master_location_data.merchant_id = pos_deposit.merchant_id AND master_location_data.method = pos_deposit.payment_method'
    );
    qb.where({
      metadata: { program },
      merchant_id: In(locations.flatMap((l) => l.merchant_ids)),
      settlement_date: Raw(
        (alias) => `${alias} >= :minDate::date and ${alias} <= :maxDate::date`,
        { minDate, maxDate }
      ),
    });

    qb.groupBy('settlement_date');
    qb.addGroupBy('terminal_no');
    qb.addGroupBy('payment_method');
    qb.addGroupBy('location_id');
    qb.addGroupBy('master_location_data.location_id');
    qb.orderBy({
      settlement_date: 'ASC',
      transaction_amt: 'ASC',
      terminal_no: 'ASC',
    });

    const deposits = await qb.getRawMany();
    return deposits.map((d) => ({
      ...d,
      merchant_id: d.location_id,
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
  /**
   * Update deposits matched on round four heuristics - calling "save" as "update" will not trigger the cascade for the many to many relations
   * @param deposits
   * @returns
   */
  async updateDeposits(
    deposits: POSDepositEntity[]
  ): Promise<POSDepositEntity[]> {
    await this.posDepositRepo.manager.transaction(
      async (manager) =>
        await Promise.all(
          deposits.map((d) => manager.save(POSDepositEntity, d))
        )
    );

    return deposits;
  }

  /**
   * updateDepositStatus
   * This will update necessary deposits to a desired MatchStatus.
   * This should be more performant as it is wrapped in a transaction
   * @param deposits A list of deposit entities to set a new status for, with the expected heuristic round
   * @returns {POSDepositEntity[]} The same list of deposits passed in
   */
  async updateDepositStatus(
    deposits: POSDepositEntity[]
  ): Promise<POSDepositEntity[]> {
    // TODO: Wrap in a try catch
    await this.posDepositRepo.manager.transaction(async (manager) => {
      await Promise.all(
        deposits.map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { timestamp, ...dep } = d;
          return manager.update(POSDepositEntity, { id: dep.id }, { ...dep });
        })
      );
    });
    return deposits;
  }

  /**
   * Find all pos deposits for the details report - return any entities marked as matched or in progress on this day as well as any pending
   * @param dateRange
   * @param program
   * @returns
   */
  async findAllByReconciledDate(
    dateRange: DateRange,
    program: Ministries,
    busDays: number
  ): Promise<POSDepositEntity[]> {
    const reconciled = await this.posDepositRepo.find({
      where: {
        reconciled_on: Between(
          subBusinessDays(
            parse(dateRange.minDate, 'yyyy-MM-dd', new Date()),
            busDays
          ),
          addBusinessDays(
            parse(dateRange.maxDate, 'yyyy-MM-dd', new Date()),
            busDays
          )
        ),
        metadata: { program },
        status: In([MatchStatus.EXCEPTION, MatchStatus.MATCH]),
      },
      relations: {
        payment_match: true,
      },
      order: {
        merchant_id: 'ASC',
        reconciled_on: 'ASC',
        transaction_amt: 'ASC',
        status: 'ASC',
      },
    });
    const in_progress = await this.posDepositRepo.find({
      where: {
        in_progress_on: Between(
          parse(dateRange.minDate, 'yyyy-MM-dd', new Date()),
          parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
        ),
        metadata: { program },
        status: MatchStatus.IN_PROGRESS,
      },
      order: {
        merchant_id: 'ASC',
        in_progress_on: 'ASC',
        transaction_amt: 'ASC',
      },
    });
    const { minDate, maxDate } = dateRange;
    const pending = await this.posDepositRepo.find({
      where: {
        transaction_date: Raw(
          (alias) => `${alias} >= :minDate and ${alias} <= :maxDate`,
          { minDate, maxDate }
        ),
        metadata: { program },
        status: MatchStatus.PENDING,
      },
      order: {
        merchant_id: 'ASC',
        transaction_amt: 'ASC',
      },
    });
    return [...reconciled, ...in_progress, ...pending];
  }
}
