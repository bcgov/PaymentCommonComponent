import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addBusinessDays, parse, subBusinessDays } from 'date-fns';
import {
  Between,
  FindOptionsOrderValue,
  In,
  LessThanOrEqual,
  Raw,
  Repository,
} from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { MatchStatusAll, MatchStatus } from '../common/const';
import { mapLimit } from '../common/promises';
import { DateRange, Ministries } from '../constants';
import datasource from '../database/datasource';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class CashDepositService {
  constructor(
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(CashDepositService.name);
  }

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

  async updateAndSaveCashDeposits(data: CashDepositEntity[]): Promise<void> {
    const queryRunner = datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(data);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
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
    pt_location_ids: number[],
    statuses?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const depositStatus = statuses ?? MatchStatusAll;
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: In(pt_location_ids),
        metadata: { program: program },
        deposit_date,
        status: In(depositStatus),
      },
      order: {
        deposit_amt_cdn: 'DESC',
      },
    });
  }
  /**
   * Find all cash deposit dates for a particular location
   * @param program
   * @param pt_location_id
   * @returns
   */
  async findAllCashDepositDatesPerLocation(
    program: Ministries,
    pt_location_ids: number[],
    order: FindOptionsOrderValue
  ): Promise<string[]> {
    const deposits: CashDepositEntity[] = await this.cashDepositRepo.find({
      where: {
        metadata: { program },
        pt_location_id: In(pt_location_ids),
      },
      order: {
        deposit_date: order,
      },
    });
    return Array.from(new Set(deposits.map((itm) => itm.deposit_date)));
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
    pt_location_ids: number[]
  ): Promise<CashDepositEntity[]> {
    return await this.cashDepositRepo.find({
      where: {
        pt_location_id: In(pt_location_ids),
        metadata: { program: program },
        deposit_date: LessThanOrEqual(date),
        status: MatchStatus.IN_PROGRESS,
      },
    });
  }
  /**
   * CAS report specific query
   * @param location
   * @param program
   * @param dateRange
   * @returns
   */
  async findCashDepositsForPageThreeReport(
    pt_location_ids: number[],
    program: Ministries,
    dateRange: DateRange,
    statuses?: MatchStatus[]
  ): Promise<CashDepositEntity[]> {
    const { minDate, maxDate } = dateRange;

    return await this.cashDepositRepo.find({
      where: {
        metadata: { program },
        status: In(statuses ?? MatchStatusAll),
        deposit_date: Raw(
          (alias) =>
            `${alias} >= :minDate::date and ${alias} <= :maxDate::date`,
          {
            minDate,
            maxDate,
          }
        ),
        pt_location_id: In(pt_location_ids),
      },
      order: {
        deposit_date: 'ASC',
        deposit_amt_cdn: 'ASC',
      },
    });
  }
  /**
   * Find all cash deposits for the details report - return any entities marked as matched or in progress on this day as well as any pending
   * @param dateRange
   * @param program
   * @returns
   */
  async findCashDepositsForDetailsReport(
    dateRange: DateRange,
    program: Ministries,
    busDays: number
  ): Promise<CashDepositEntity[]> {
    const reconciled = await this.cashDepositRepo.find({
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
      order: {
        pt_location_id: 'ASC',
        reconciled_on: 'ASC',
        deposit_amt_cdn: 'ASC',
        status: 'ASC',
      },
    });
    const in_progress = await this.cashDepositRepo.find({
      where: {
        in_progress_on: Between(
          parse(dateRange.minDate, 'yyyy-MM-dd', new Date()),
          parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
        ),
        metadata: { program },
        status: MatchStatus.IN_PROGRESS,
      },
      order: {
        pt_location_id: 'ASC',
        in_progress_on: 'ASC',
        deposit_amt_cdn: 'ASC',
      },
      relations: {
        payment_matches: false,
      },
    });
    const { minDate, maxDate } = dateRange;
    const pending = await this.cashDepositRepo.find({
      where: {
        deposit_date: Raw(
          (alias) => `${alias} >= :minDate and ${alias} <= :maxDate`,
          { minDate, maxDate }
        ),
        metadata: { program },
        status: MatchStatus.PENDING,
      },
      order: {
        pt_location_id: 'ASC',
        deposit_amt_cdn: 'ASC',
      },
      relations: {
        payment_matches: false,
      },
    });
    return [...reconciled, ...in_progress, ...pending];
  }
  async findWithNullLocation(
    program: Ministries
  ): Promise<CashDepositEntity[]> {
    return this.cashDepositRepo.find({
      where: { bank: undefined, metadata: { program } },
    });
  }
}
