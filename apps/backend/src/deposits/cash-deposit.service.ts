import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, MoreThanOrEqual } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { MatchStatus } from '../common/const';
import { AppLogger } from '../logger/logger.service';
import {
  GroupedPaymentsAndDeposits,
  ReconciliationEvent
} from '../reconciliation/types';

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

  async createCashDeposit(data: CashDepositEntity): Promise<CashDepositEntity> {
    try {
      return await this.cashDepositRepo.save(this.cashDepositRepo.create(data));
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
  }

  aggregateDeposits(
    event: ReconciliationEvent,
    deposits: CashDepositEntity[]
  ): GroupedPaymentsAndDeposits[] {
    const groupedDeposits = deposits.reduce(
      /*eslint-disable */
      (acc: any, deposit: CashDepositEntity) => {
        const key = `${deposit.deposit_date}`;
        if (!acc[key]) {
          acc[key] = {
            deposit_date: deposit.deposit_date,
            location_id: deposit.location_id,
            deposit_sum: 0,
            deposits: []
          };
        }
        acc[key].deposit_sum += deposit.deposit_amt_cdn;
        acc[key].deposits.push(deposit);
        return acc;
      },
      {}
    );

    const result = Object.values(groupedDeposits);

    return result as GroupedPaymentsAndDeposits[];
  }

  async getCashDepositDates(event: ReconciliationEvent): Promise<string[]> {
    const {
      program,
      location: { location_id }
    } = event;
    /**
     * @description This query is returning the 3rd most recent deposit date
     */
    const dates = await this.cashDepositRepo
      .createQueryBuilder('cash_deposit')
      .select('distinct deposit_date')
      .where('cash_deposit.location_id = :location_id', { location_id })
      .andWhere('cash_deposit.deposit_date <= :deposit_date', {
        deposit_date: event.date
      })
      .andWhere('cash_deposit.program = :program', { program })
      .orderBy({
        'cash_deposit.deposit_date': 'DESC'
      })
      .limit(3)
      .getRawMany();

    return dates.map((itm) => itm.deposit_date);
  }
  /**
   * @param event
   * @returns CashDepositEntity[]
   * @description Filter by location, program, and current date
   */
  async findCashDepositsByDateLocationAndProgram(
    event: ReconciliationEvent
  ): Promise<CashDepositEntity[]> {
    const {
      program,
      location: { location_id }
    } = event;

    /**
     * @description This query is returning the deposits from the three most recent deposit dates
     */
    const date = await this.getCashDepositDates(event);
    const deposits = await this.cashDepositRepo.find({
      where: {
        location_id,
        metadata: { program },
        deposit_date: MoreThanOrEqual(date[1]),
        status: In([MatchStatus.PENDING, MatchStatus.IN_PROGRESS])
      },
      order: {
        deposit_date: 'DESC',
        location_id: 'ASC'
      }
    });
    return deposits;
  }

  async updateDepositStatus(
    deposit: CashDepositEntity
  ): Promise<CashDepositEntity> {
    const depositEntity = await this.cashDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    return await this.cashDepositRepo.save({ ...depositEntity, ...deposit });
  }
}
