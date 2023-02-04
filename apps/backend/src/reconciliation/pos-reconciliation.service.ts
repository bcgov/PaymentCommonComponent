import { Injectable, Logger, Inject } from '@nestjs/common';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { POSDepositEntity } from './../deposits/entities/pos-deposit.entity';
import { TransactionService } from '../transaction/transaction.service';
import { AppLogger } from '../common/logger.service';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { PosPaymentPosDepositPair } from './reconciliation.interfaces';
import { differenceInSeconds } from 'date-fns';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  // TODO: move the save as matched seaparetly..

  private matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): PosPaymentPosDepositPair[] {
    const matches: PosPaymentPosDepositPair[] = [];

    // Basic 1:1 matching

    for (const payment of payments) {
      const allMatchesForThisPayment: PosPaymentPosDepositPair[] = [];
      
      console.log(`Processing payment ${payment.id} for ${payment.amount} - ${payment.timestamp}`)
      for (const deposit of deposits) {

        console.log(`Processing deposit ${deposit.id} for ${deposit.transaction_amt} - ${deposit.timestamp}`)
        if (
          payment.amount === deposit.transaction_amt &&
          payment.method === deposit.card_vendor && 
          differenceInSeconds(payment.timestamp, deposit.timestamp) < 60
        ) {
          allMatchesForThisPayment.push({
            payment,
            deposit
          });
        }
      }

      // Link matches
      if (allMatchesForThisPayment.length === 1) {
        allMatchesForThisPayment[0].payment.match = true;
        allMatchesForThisPayment[0].deposit.match = true;
        allMatchesForThisPayment[0].payment.deposit_id =
          allMatchesForThisPayment[0].deposit.id;
        allMatchesForThisPayment[0].deposit.matched_payment_id =
          allMatchesForThisPayment[0].payment.id;
        matches.push(...allMatchesForThisPayment);
      }

      if (matches.length > 1) {
        console.log(`More than one match found for ${payment.id}`);
      }
    }

    console.log(matches);
    return matches;
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<any | ReconciliationEventOutput | ReconciliationEventError> {

    const posPayments = await this.transactionService.queryPosPayments(event);
    const alreadyMatchedPosPayments = posPayments.filter((itm) => itm.match);
    const yetToBeMatchedPosPayments = posPayments.filter((itm) => !itm.match);

    const deposits = await this.posDepositService.findPOSDeposits(event);
    const alreadyMatchedPosDeposits = deposits.filter((itm) => itm.match);
    const yetToBeMatchedPosDeposits = deposits.filter((itm) => !itm.match);

    const matched_in_this_run = this.matchPosPaymentToPosDeposits(
      yetToBeMatchedPosPayments,
      yetToBeMatchedPosDeposits
    );

    // Mark as matched here:

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
