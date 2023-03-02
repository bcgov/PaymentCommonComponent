import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
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
        deposit_date: LessThanOrEqual(date),
        status: status
      },
      order: {
        deposit_date: 'ASC',
        deposit_amt_cdn: 'DESC'
      }
    });
  }

  public async findPastDueDate(
    event: ReconciliationEvent
  ): Promise<{ currentDate: string; pastDueDate: string | null }> {
    const {
      date,
      program,
      location: { pt_location_id }
    } = event;

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
    if (distinctDepositDates.length < 4)
      return {
        currentDate: date,
        pastDueDate: null
      };
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
    const {
      date,
      program,
      location: { pt_location_id }
    } = event;

    const dates = await this.cashDepositRepo.find({
      select: { deposit_date: true },
      where: {
        pt_location_id,
        metadata: { program },
        deposit_date: LessThanOrEqual(date)
      },
      order: {
        deposit_date: 'ASC'
      }
    });

    return Array.from(new Set(dates.map((item) => item.deposit_date)));
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
