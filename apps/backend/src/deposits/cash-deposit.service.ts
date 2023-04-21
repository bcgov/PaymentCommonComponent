import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Raw, Repository } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { MatchStatus } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';
import { MatchStatusAll } from './../common/const';

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
  async findCashDepositsByDateLocationAndProgram(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity,
    status?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const depositStatus = status ?? MatchStatusAll;
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date: dateRange.to_date,
        status: In(depositStatus)
      },
      order: {
        deposit_amt_cdn: 'ASC'
      }
    });
  }

  async findCashDepositDateWindow(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ) {
    const { to_date } = dateRange;
    const dates = await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program },
        deposit_date: LessThanOrEqual(to_date)
      },
      order: {
        deposit_date: 'DESC'
      }
    });

    return Array.from(new Set(dates.map((itm) => itm.deposit_date)));
  }
  /**
   *
   * @param program
   * @param dateRange
   * @param location
   * @returns
   */
  public async findDistinctDepositDatesByLocation(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<string[]> {
    const { to_date, from_date } = dateRange;
    const qb = this.cashDepositRepo.createQueryBuilder('cash_deposit');
    qb.select('deposit_date');
    qb.distinctOn(['deposit_date']);
    qb.where({
      pt_location_id: location.pt_location_id,
      metadata: { program },
      deposit_date: Raw(
        (alias) => `${alias} <= :to_date and ${alias} >= :from_date`,
        {
          from_date: from_date,
          to_date: to_date
        }
      )
    });
    qb.orderBy('deposit_date', 'ASC');
    const dates = await qb.getRawMany();
    return dates.map((itm) => itm.deposit_date);
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

  async findExceptions(
    date: string,
    program: Ministries,
    location: LocationEntity
  ) {
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date: LessThanOrEqual(date),
        status: In([MatchStatus.PENDING, MatchStatus.IN_PROGRESS])
      }
    });
  }
  /**
   *
   * @param location
   * @param program
   * @param dateRange
   * @returns
   */
  async findCashDepositsByDateRange(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange,
    status?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const { to_date, from_date } = dateRange;
    const depositStatus = status ?? MatchStatusAll;
    return await Promise.all(
      await this.cashDepositRepo.find({
        where: {
          metadata: { program },
          status: In(depositStatus),
          deposit_date: Raw(
            (alias) => `${alias} >= :from_date and ${alias} <= :to_date`,
            {
              from_date: from_date,
              to_date: to_date
            }
          ),
          pt_location_id: location.pt_location_id
        },
        order: {
          deposit_date: 'ASC',
          deposit_amt_cdn: 'ASC'
        }
      })
    );
  }
}
