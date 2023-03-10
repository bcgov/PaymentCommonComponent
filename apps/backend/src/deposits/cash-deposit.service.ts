import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository, LessThanOrEqual } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { MatchStatus } from '../common/const';
import { AppLogger } from '../logger/logger.service';
import { ReconciliationEvent } from '../reconciliation/types';

@Injectable()
export class CashDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>
  ) {}

  findAll(): Promise<CashDepositEntity[]> {
    return this.cashDepositRepo.find();
  }

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
  async createCashDeposit(data: CashDepositEntity): Promise<CashDepositEntity> {
    try {
      return await this.cashDepositRepo.save(this.cashDepositRepo.create(data));
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
  }

  /**
   * @param event
   * @returns CashDepositEntity[]
   * @description Filter by location, program, and current date
   */
  async findCashDepositsByDateLocationAndProgram(
    event: ReconciliationEvent,
    status: MatchStatus
  ): Promise<CashDepositEntity[]> {
    const {
      program,
      date,
      location: { pt_location_id }
    } = event;

    return await this.cashDepositRepo.find({
      where: {
        pt_location_id,
        metadata: { program: program },
        deposit_date: date,
        status: status
      },
      order: {
        deposit_date: 'DESC',
        deposit_amt_cdn: 'DESC'
      }
    });
  }

  public async findPastDueDate(
    event: ReconciliationEvent
  ): Promise<{ currentDate: string; pastDueDate: string } | void> {
    const {
      date,
      program,
      location: { pt_location_id }
    } = event;
    if (!date) return;
    const dates = await this.cashDepositRepo.find({
      select: { deposit_date: true },
      where: {
        pt_location_id,
        metadata: { program },
        deposit_date: LessThanOrEqual(date)
      },
      order: {
        deposit_date: 'DESC'
      }
    });
    const distinctDepositDates = Array.from(
      new Set(dates.map((item) => item.deposit_date))
    );
    if (distinctDepositDates.length < 4) return;

    return {
      currentDate: date,
      pastDueDate: distinctDepositDates[3]
    };
  }

  /**
   *
   * @param event
   * @param pastDueDate
   * @returns string[]
   * @description Find all deposit dates for a specific location and program, in ascending order, which are still
   *  pending or in progress. This is used to find the dates that need to be reconciled.
   */
  public async depositDates(event: ReconciliationEvent): Promise<string[]> {
    const { fiscal_close_date, fiscal_start_date, program, location } = event;

    const dates = await this.cashDepositRepo.find({
      select: { deposit_date: true },
      where: {
        pt_location_id: location.pt_location_id,
        metadata: { program },
        deposit_date: Raw(
          (alias) =>
            `${alias} <= :fiscal_close_date and ${alias} > :fiscal_start_date `,
          {
            fiscal_close_date,
            fiscal_start_date
          }
        )
      },
      order: {
        deposit_date: 'DESC'
      }
    });

    return Array.from(new Set(dates.map((item) => item.deposit_date)));
  }
  /**
   * @param deposits: CashDepositEntity[]
   * @param status: MatchStatus
   * @returns CashDepositEntity
   */
  async updateDeposits(
    deposits: CashDepositEntity[],
    status: MatchStatus
  ): Promise<CashDepositEntity[]> {
    this.appLogger.log(
      `UPDATED: ${deposits.length} CASH DEPOSITS to ${status.toUpperCase()}`,
      CashDepositService.name
    );

    return await Promise.all(
      deposits.map(
        async (deposit) =>
          await this.updateDepositStatus({ ...deposit, status })
      )
    );
  }
  /**
   * @param deposit
   * @returns CashDepositEntity
   */
  async updateDepositStatus(
    deposit: CashDepositEntity
  ): Promise<CashDepositEntity> {
    const depositEntity = await this.cashDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    return await this.cashDepositRepo.save({ ...depositEntity, ...deposit });
  }
}
