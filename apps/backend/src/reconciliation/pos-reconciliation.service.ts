import { Injectable, Logger, Inject } from '@nestjs/common';
import { differenceInSeconds } from 'date-fns';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PosPaymentPosDepositPair } from './reconciliation.interfaces';
import { checkPaymentsForFullMatch } from './util';
import { AppLogger } from '../common/logger.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { TransactionService } from '../transaction/transaction.service';
import { POSDepositEntity } from './../deposits/entities/pos-deposit.entity';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  // TODO: move the save as matched seaparetly..
  // TODO: implement as layer
  // TODO: possible to config time diffs?
  private matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): PosPaymentPosDepositPair[] {
    const matches: PosPaymentPosDepositPair[] = [];

    // Basic EAGER! 1:1 matching

    for (const payment of payments) {
      // console.log(`Processing payment for ${payment.amount} - ${payment.id} - ${payment.timestamp}`)
      for (const deposit of deposits) {
        // console.log(`Processing deposit ${deposit.id} for ${deposit.transaction_amt} - ${deposit.timestamp}`)

        // TODO:make this a strategy pattern
        if (
          payment.amount === deposit.transaction_amt &&
          payment.method === deposit.card_vendor &&
          differenceInSeconds(payment.timestamp, deposit.timestamp) < 240
        ) {
          matches.push({
            payment,
            deposit
          });
          break;
        }
      }
    }

    for (const match of matches) {
      match.payment.match = true;
      match.deposit.match = true;
      match.payment.deposit_id = match.deposit.id;
      match.deposit.matched_payment_id = match.payment.id;
    }
    return matches;
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<unknown | ReconciliationEventOutput | ReconciliationEventError> {
    const posPayments = await this.transactionService.queryPosPayments(event);

    if (checkPaymentsForFullMatch(posPayments)) {
      console.log(`****All payments are already matched for this event`);
      return;
    }
    const alreadyMatchedPosPayments = posPayments.filter((itm) => itm.match);
    if (posPayments.length === 0) {
    }
    const yetToBeMatchedPosPayments = posPayments.filter((itm) => !itm.match);

    const deposits = await this.posDepositService.findPOSDeposits(event);
    const alreadyMatchedPosDeposits = deposits.filter((itm) => itm.match);
    const yetToBeMatchedPosDeposits = deposits.filter((itm) => !itm.match);

    const matched_in_this_run = this.matchPosPaymentToPosDeposits(
      yetToBeMatchedPosPayments,
      yetToBeMatchedPosDeposits
    );

    await this.transactionService.markPosPaymentsAsMatched(matched_in_this_run);
    await this.posDepositService.markPosDepositsAsMatched(matched_in_this_run);

    return {
      pos_payments_total: posPayments.length,
      pos_deposit_total: deposits.length,

      pos_payments_already_matched: alreadyMatchedPosPayments.length,
      pos_deposit_already_matched: alreadyMatchedPosDeposits.length,

      pos_payments_yet_to_be_matched: yetToBeMatchedPosPayments.length,
      pos_deposit_yet_to_be_matched: yetToBeMatchedPosDeposits.length,

      pos_payments_matched_now: matched_in_this_run.length
    };
  }
}
