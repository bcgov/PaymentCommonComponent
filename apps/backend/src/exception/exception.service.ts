import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashDepositEntity } from '../cash/entities/cash-deposit.entity';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import { PaymentEntity, TransactionEntity } from '../sales/entities';

export class ExceptionService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(POSDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @InjectRepository(POSDepositEntity)
    private paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(TransactionEntity)
    private transactionsRepo: Repository<TransactionEntity>
  ) {


  }
}
