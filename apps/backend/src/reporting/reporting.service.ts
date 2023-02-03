import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity, TransactionEntity } from '../transaction/entities';
import { ReportConfig } from './interfaces';


export class ReportingService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @InjectRepository(PaymentEntity)
    private paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(TransactionEntity)
    private transactionsRepo: Repository<TransactionEntity>
  ) {}

  async generateReport(config: ReportConfig) {
    this.appLogger.log(config);
    this.appLogger.log('Generating report');

    
  }
}
