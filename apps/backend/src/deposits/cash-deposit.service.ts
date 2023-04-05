import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Raw, Repository, UpdateResult } from 'typeorm';
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
   *
   * @returns
   */
  findAll(): Promise<CashDepositEntity[]> {
    return this.cashDepositRepo.find();
  }
  /**
   *
   * @returns
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
   * @returns
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
    date: string,
    location: LocationEntity,
    status?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const depositStatus = status ?? MatchStatusAll;
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date: date,
        status: In(depositStatus)
      },
      order: {
        deposit_amt_cdn: 'ASC'
      }
    });
  }

  /**
   *
   * @param event
   * @param pastDueDate
   * @returns string[]
   * @description Find all deposit dates for a specific location and program, in descending order, which are still
   *  pending or in progress. This is used to find the dates that need to be reconciled.
   */
  public async findDistinctDepositDates(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity,
    reverse?: boolean
  ): Promise<string[]> {
    const { to_date, from_date } = dateRange;
    const dates = await this.cashDepositRepo.find({
      select: { deposit_date: true },
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program },
        deposit_date: Raw(
          (alias) => `${alias} <= :to_date and ${alias} >= :from_date`,
          {
            to_date,
            from_date
          }
        )
      },
      order: {
        deposit_date: 'ASC'
      }
    });

    const datesArray: string[] = Array.from(
      new Set(dates.map((item) => item.deposit_date))
    );
    return reverse ? datesArray.reverse() : datesArray;
  }
  /**
   * @param deposits: CashDepositEntity[]
   * @param status: MatchStatus
   * @returns CashDepositEntity
   */
  async updateDeposits(deposits: CashDepositEntity[]): Promise<UpdateResult[]> {
    return await Promise.all(
      deposits.map(async (deposit) => await this.updateDeposit(deposit))
    );
  }
  /**
   * @param deposit
   * @returns CashDepositEntity
   */
  async updateDeposit(deposit: CashDepositEntity): Promise<UpdateResult> {
    const id = deposit.id;
    return await this.cashDepositRepo.update(id, deposit);
  }

  async findExceptions(
    date: string,
    program: Ministries,
    location: LocationEntity
  ) {
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program: program },
        deposit_date: LessThan(date),
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
    dateRange: DateRange
  ): Promise<CashDepositEntity[]> {
    const { to_date, from_date } = dateRange;
    return await Promise.all(
      await this.cashDepositRepo.find({
        select: {
          deposit_date: true,
          deposit_amt_cdn: true
        },
        where: {
          metadata: { program },
          deposit_date: Raw(
            (alias) =>
              `${alias} >= :from_date::date and ${alias} <= :to_date::date`,
            { from_date, to_date }
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
