import { Injectable, Inject, Logger } from '@nestjs/common';
import { differenceInSeconds } from 'date-fns';
import _ from 'underscore';
import {
  ReconciliationEvent,
  ReconciliationEventError,
  ReconciliationType,
  PosPaymentPosDepositPair,
  PosExceptions
} from './types';
import { MatchStatus } from '../common/const';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  public handleExceptions(
    matches: PosPaymentPosDepositPair[],

    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): PosExceptions {
    /**
     * look through the list of deposits, return an array of all the values that are not present in the matches array.
     */
    const depositDiff = _.difference(
      deposits,
      matches.map(
        (itm: { payment: PaymentEntity; deposit: POSDepositEntity }) =>
          itm.deposit
      )
    );

    const depositExceptions =
      depositDiff.map((deposit: POSDepositEntity) => ({
        ...deposit,
        timestamp: deposit.timestamp,
        status: MatchStatus.EXCEPTION
      })) ?? [];

    /**
     * look through the list of payments, return an array of all the values that are not present in the matches array.
     */
    const paymentExceptions =
      _.difference(
        payments,
        matches.map(
          (itm: { payment: PaymentEntity; deposit: POSDepositEntity }) =>
            itm.payment
        )
      ).map((payment: PaymentEntity) => ({
        ...payment,
        timestamp: payment.timestamp,
        status: MatchStatus.EXCEPTION
      })) ?? [];

    return { depositExceptions, paymentExceptions };
  }

  // TODO [CCFPCM-406] move the save as matched separately..
  // TODO [CCFPCM-406] implement as layer
  public verifyTimeMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    //TODO [CCFPCM-406] make this configurable ?
    // TODO [CCFPCM-406] possible to config time diffs?
    return differenceInSeconds(payment.timestamp, deposit.timestamp) < 240;
  }

  public matchAmountAndMethod(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return _.isMatch(
      {
        amount: payment.amount,
        method: payment.method,
        status: MatchStatus.PENDING
      },
      {
        amount: deposit.transaction_amt,
        method: deposit.card_vendor,
        status: MatchStatus.PENDING
      }
    );
  }

  public matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): PosPaymentPosDepositPair[] {
    const matches: PosPaymentPosDepositPair[] = [];

    // Basic EAGER! 1:1 matching
    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        if (this.matchAmountAndMethod(payment, deposit)) {
          if (this.verifyTimeMatch(payment, deposit)) {
            payments[pindex].status = MatchStatus.MATCH;
            deposits[dindex].status = MatchStatus.MATCH;
            payments[pindex].pos_deposit_match = deposit;

            matches.push({
              payment: payments[pindex],
              deposit: deposits[dindex]
            });
            break;
          }
        }
      }
    }
    return matches;
  }

  public filterDataPriorToReconciliation(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): {
    payments: PaymentEntity[];
    deposits: POSDepositEntity[];
  } {
    return {
      payments: payments.filter(
        (itm: PaymentEntity) => itm.status === MatchStatus.PENDING
      ),
      deposits: deposits.filter(
        (itm: POSDepositEntity) => itm.status === MatchStatus.PENDING
      )
    };
  }

  public async updateMatchedEntities(
    matches: { payment: PaymentEntity; deposit: POSDepositEntity }[]
  ): Promise<{
    matchedPayments: PaymentEntity[];
    matchedDeposits: POSDepositEntity[];
  }> {
    return {
      matchedPayments: await this.transactionService.markPosPaymentsAsMatched(
        matches.filter((itm) => itm.payment)
      ),

      matchedDeposits: await this.posDepositService.markPosDepositsAsMatched(
        matches.filter((itm) => itm.deposit)
      )
    };
  }

  public async updateExceptionEntities(
    exceptions: PosExceptions
  ): Promise<PosExceptions> {
    const { paymentExceptions, depositExceptions } = exceptions;
    return {
      paymentExceptions: await Promise.all(
        paymentExceptions.map(
          async (itm: PaymentEntity) =>
            await this.transactionService.updatePaymentStatus(itm)
        )
      ),

      depositExceptions: await Promise.all(
        depositExceptions.map(
          async (itm: POSDepositEntity) =>
            await this.posDepositService.markPosDepositAsException(itm)
        )
      )
    };
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<unknown | ReconciliationEventError> {
    /**
     * Find all the pending payments and deposits
     */
    const { payments: pendingPayments, deposits: pendingDeposits } =
      this.filterDataPriorToReconciliation(
        await this.transactionService.findPosPayments(event),
        await this.posDepositService.findPOSDeposits({
          program: event.program,
          date: event.date,
          location: event.location
        } as ReconciliationEvent)
      );
    this.appLogger.log('pending payments', pendingPayments.length);
    this.appLogger.log('pending deposits', pendingDeposits.length);

    if (pendingPayments.length === 0 || pendingDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found'
      };
    }

    /**
     * Match the payments to the deposits
     */
    const matches = this.matchPosPaymentToPosDeposits(
      pendingPayments,
      pendingDeposits
    );
    this.appLogger.log(`Found ${matches.length} POS matches`);

    /**
     * Update matched entities with status and ids
     */

    const { matchedPayments, matchedDeposits } =
      await this.updateMatchedEntities(matches);

    /**
     * Handle the exceptions
     */
    const exceptions = this.handleExceptions(
      matches,
      pendingPayments,
      pendingDeposits
    );

    const { paymentExceptions, depositExceptions } =
      await this.updateExceptionEntities(exceptions);

    this.appLogger.log(
      `Found ${paymentExceptions.length} POS payment exceptions`
    );
    this.appLogger.log(
      `Found ${depositExceptions.length} POS deposit exceptions`
    );

    return {
      transaction_date: event.date,
      type: ReconciliationType.POS,
      location_id: event.location.location_id,
      total_pending: pendingPayments.length,
      total_matched_payments: matchedPayments.length,
      total_matched_deposits: matchedDeposits.length,
      total_exceptions: paymentExceptions.length,
      percent_matched: parseFloat(
        ((matchedPayments.length / pendingPayments.length) * 100).toFixed(2)
      )
    };
  }
}
