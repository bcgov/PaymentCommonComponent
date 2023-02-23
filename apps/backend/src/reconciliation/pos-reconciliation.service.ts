import { Injectable, Logger, Inject } from '@nestjs/common';
import { differenceInSeconds } from 'date-fns';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PosPaymentPosDepositPair } from './reconciliation.interfaces';
import { checkPaymentsForFullMatch } from './util';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
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

    for (const [pindex, payment] of payments.entries()) {
      // console.log(`Processing payment for ${payment.amount} - ${payment.id} - ${payment.timestamp}`)
      for (const [dindex, deposit] of deposits.entries()) {
        // console.log(`Processing deposit ${deposit.id} for ${deposit.transaction_amt} - ${deposit.timestamp}`)

        // TODO:make this a strategy pattern
        if (
          payment.amount === deposit.transaction_amt &&
          payment.method === deposit.card_vendor &&
          deposit.match === false &&
          differenceInSeconds(payment.timestamp, deposit.timestamp) < 240
        ) {
          // mutate the original array to use in next heurisitc match
          // after this deposit is used up, mark it as true and don't use it again
          payments[pindex].match = true;
          deposits[dindex].match = true;
          payments[pindex].deposit_id = deposit.id;
          deposits[dindex].matched_payment_id = payment.id;

          matches.push({
            payment,
            deposit
          });

          break;
        }
      }
    }
    return matches;
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<unknown | ReconciliationEventOutput | ReconciliationEventError> {
    const posPayments = await this.transactionService.queryPosPayments(event);

    if (posPayments.length === 0) {
      console.log(`****0 POS Payments Found, Skipping****`);
      return;
    }

    if (checkPaymentsForFullMatch(posPayments)) {
      console.log(`****All payments are already matched /for this event****`);
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
