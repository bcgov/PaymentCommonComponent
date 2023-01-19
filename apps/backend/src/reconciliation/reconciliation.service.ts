import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { parseGarms } from '../lambdas/utils/parseGarms';

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(TransactionEntity)
    private salesRepo: Repository<TransactionEntity>,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>
  ) {}

  //TODO this is temporary for testing the parsed garms json only
  async readAndParseGarms(filename: string, filebuffer: Buffer) {
    try {
      return parseGarms(JSON.parse(filebuffer.toString()));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  async readAndParseFile(
    type: string,
    program: string,
    fileName: string,
    data: Buffer
  ): Promise<any> {
    try {
      return parseTDI(type, data.toString(), fileName, program);
    } catch (err) {
      this.appLogger.error(err, 'Error inserting TDI34 to POS Deposits table');
      throw err;
    }
  }

  async mapPOSDeposit(data: POSDepositEntity[]): Promise<POSDepositEntity[]> {
    try {
      return Promise.all(
        data.map(
          async (itm: POSDepositEntity) =>
            await this.posDepositRepo.save(this.posDepositRepo.create(itm))
        )
      );
    } catch (err) {
      this.appLogger.error(err, 'Error inserting TDI34 to POS Deposits table');
      throw err;
    }
  }

  async mapCashDeposit(
    data: CashDepositEntity[]
  ): Promise<CashDepositEntity[]> {
    try {
      return Promise.all(
        data.map((itm: CashDepositEntity) =>
          this.cashDepositRepo.save(this.cashDepositRepo.create(itm))
        )
      );
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
  }

  async mapSalesTransaction(data: any): Promise<TransactionEntity[]> {
    try {
      return Promise.all(
        data.map((itm: Partial<TransactionEntity>) =>
          this.salesRepo.save(this.salesRepo.create(itm))
        )
      );
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }
}
