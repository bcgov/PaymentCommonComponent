import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Raw, Repository } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { MatchStatus } from '../common/const';
import { MatchStatusAll } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class CashDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>
  ) {}

  /**
   * @description Find all uploaded files
   * @returns {Promise<{ cash_deposit_source_file_name: string }[]>}
   */
  async findAllUploadedFiles(): Promise<
    { cash_deposit_source_file_name: string }[]
  > {
    return this.cashDepositRepo
      .createQueryBuilder('cash_deposit')
      .select('cash_deposit.metadata.source_file_name')
      .distinct()
      .getRawMany();
  }
  /**
   * @param data
   * @returns CashDepositEntity[]
   * @description Create a new cash deposit
   */

  async saveCashDepositEntities(
    data: CashDepositEntity[]
  ): Promise<CashDepositEntity[]> {
    try {
      const entities = data.map((d) => this.cashDepositRepo.create(d));
      return mapLimit(entities, (entity) => this.cashDepositRepo.save(entity));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  /**
   * @param event
   * @returns CashDepositEntity[]
   * @description Filter by location and date. Optionally, filter by program, and status.
   */
  async findCashDepositsByDate(
    program: Ministries,
    deposit_date: string,
    location: LocationEntity,
    statuses?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const depositStatus = statuses ?? MatchStatusAll;
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date,
        status: In(depositStatus),
      },
      order: {
        deposit_amt_cdn: 'ASC',
      },
    });
  }

  async findCashDepositDatesByLocation(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<string[]> {
    const { minDate, maxDate } = dateRange;
    const dates: CashDepositEntity[] = await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program },
        deposit_date: Raw(
          (alias) => `${alias} <= :maxDate and ${alias} >= :minDate`,
          { maxDate, minDate }
        ),
      },
      order: {
        deposit_date: 'ASC',
      },
    });
    const uniqueDates = dates.map((d) => d.deposit_date);
    return Array.from(new Set(uniqueDates));
  }

  /**
   * @param deposits: CashDepositEntity[]
   * @param status: MatchStatus
   * @returns CashDepositEntity
   */
  async updateDeposits(
    deposits: CashDepositEntity[]
  ): Promise<CashDepositEntity[]> {
    return await Promise.all(
      deposits.map((deposit) => this.updateDeposit(deposit))
    );
  }
  /**
   * @param deposit
   * @returns CashDepositEntity
   */
  async updateDeposit(deposit: CashDepositEntity): Promise<CashDepositEntity> {
    return await this.cashDepositRepo.save(deposit);
  }
  /**
   *
   * @param date
   * @param program
   * @param location
   * @returns CashDepositEntity[]
   */

  async findCashDepositExceptions(
    date: string,
    program: Ministries,
    location: LocationEntity
  ): Promise<CashDepositEntity[]> {
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date: LessThanOrEqual(date),
        status: MatchStatus.IN_PROGRESS,
      },
    });
  }
  /**
   *
   * @param location
   * @param program
   * @param dateRange
   * @returns
   */
  async findCashDepositsForReport(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ): Promise<CashDepositEntity[]> {
    const { minDate, maxDate } = dateRange;

    return await this.cashDepositRepo.find({
      where: {
        metadata: { program },
        deposit_date: Raw(
          (alias) =>
            `${alias} >= :minDate::date and ${alias} <= :maxDate::date`,
          {
            minDate,
            maxDate,
          }
        ),
        pt_location_id: location.pt_location_id,
      },
      order: {
        deposit_date: 'ASC',
        deposit_amt_cdn: 'ASC',
      },
    });
  }
}
