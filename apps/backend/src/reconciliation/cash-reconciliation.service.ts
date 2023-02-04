import { Injectable, Inject, Logger } from '@nestjs/common';
import { AppLogger } from './../common/logger.service';
import { CashDepositService } from '../deposits/cash-deposit.service';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { CashDepositEntity } from './../deposits/entities/cash-deposit.entity';
import { TransactionService } from '../transaction/transaction.service';
import { PosPaymentPosDepositPair } from './reconciliation.interfaces';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private logger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  private allOrNoneMatchForPayments(
    deposits: CashDepositEntity[],
    payments: PaymentEntity[]
  ): PosPaymentPosDepositPair[] {

    const sumOfPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);


    for (const deposit of deposits) {
      if (deposit.deposit_amt_cdn === sumOfPayments) {
        console.log('Found a matching deposit', deposit.deposit_amt_cdn, sumOfPayments)
      }
    }

    return []
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.transactionService.queryCashPayments(event);
    const deposits = await this.cashDepositService.findCashDeposits(event);

    console.log('payments', payments);
    console.log('deposits', deposits);

    const matched =  this.allOrNoneMatchForPayments(deposits, payments);

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments ? payments.length : 0
      // total_matched: matched.length
    };
  }
}
