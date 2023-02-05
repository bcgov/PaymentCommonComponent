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
import { CashPaymentsCashDepositPair } from './reconciliation.interfaces';
import { checkPaymentsForFullMatch, checkPaymentsForPartialMatch } from './util';

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
  ): CashPaymentsCashDepositPair | void {
    const sumOfPayments = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    console.log('Sum of payments: ', sumOfPayments);

    // TODO: This does a eager match, update to be more look around
    for (const deposit of deposits) {
      // console.log('checking for deposit amt:', deposit.deposit_amt_cdn);
      if (deposit.deposit_amt_cdn === sumOfPayments) {
        const cashPaymentPair: CashPaymentsCashDepositPair = {
          payments,
          deposit: deposit
        };
        console.log('>>>>Found a matching deposit', deposit.deposit_amt_cdn);
        return cashPaymentPair;
      }
    }

    return;
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError | void> {
    const payments = await this.transactionService.queryCashPayments(event);

    // All payments are already matched, skipping...
    if (checkPaymentsForFullMatch(payments)) {
      console.log('All payments are already matched, skipping...');
      return;
    }

    // if partial match found, then log and skip
    if (checkPaymentsForPartialMatch(payments)) {
      console.log('Partial match found, handle in v2 heuristic layer...');
      return;
    }

    // zero matched implied, try to match
    const deposits = await this.cashDepositService.findAllPendingCashDeposits(
      event
    );

    // console.log('payments', payments);
    // console.table(deposits, ['deposit_amt_cdn', 'deposit_date']);

    const matched = this.allOrNoneMatchForPayments(deposits, payments);

    if (matched) {
      await this.transactionService.markCashPaymentsAsMatched(matched);
      await this.cashDepositService.markCashDepositAsMatched(matched);
    }

    return;
  }
}
