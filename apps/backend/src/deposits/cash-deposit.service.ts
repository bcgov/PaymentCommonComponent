import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
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
      location: { location_id },
      fiscal_close_date: current,
      fiscal_start_date: previous
    } = event;
    //TODO fix RAW query
    return await this.cashDepositRepo.find({
      where: {
        location_id,
        metadata: { program },
        status: In([MatchStatus.PENDING, MatchStatus.IN_PROGRESS]),
        deposit_date: Raw(
          (alias) =>
            `${alias} <= :current::date AND ${alias} > :previous::date`,
          { current, previous }
        )
      },
      order: {
        deposit_date: 'DESC',
        location_id: 'ASC'
      }
    });
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
