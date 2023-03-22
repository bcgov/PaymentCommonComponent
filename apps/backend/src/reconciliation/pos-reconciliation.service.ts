import { Injectable, Inject, Logger } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import {
  ReconciliationEvent,
  ReconciliationEventError,
  ReconciliationType
} from './types';
import { MatchStatus } from '../common/const';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(PaymentService) private paymentService: PaymentService
  ) {}

  // TODO [CCFPCM-406] move the save as matched separately..
  // TODO [CCFPCM-406] implement as layer
  public verifyTimeMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    timeDiff: number
  ): boolean {
    //TODO [CCFPCM-406] make this configurable ?
    // TODO [CCFPCM-406] possible to config time diffs?
    return differenceInMinutes(payment.timestamp, deposit.timestamp) < timeDiff;
  }
  /**
   *
   * @param payment
   * @param deposit
   * @returns
   */

  public verifyMethod(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.method === deposit.card_vendor;
  }
  /**
   *
   * @param payment
   * @param deposit
   * @returns
   */
  public verifyAmount(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.amount === deposit.transaction_amt;
  }
  /**
   *
   * @param payment
   * @param deposit
   * @returns
   */
  public verifyPendingStatus(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      payment.status === MatchStatus.PENDING &&
      deposit.status === MatchStatus.PENDING
    );
  }
  /**
   *
   * @param payment
   * @param deposit
   * @returns
   */
  public verifyMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    timeDiff: number
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyPendingStatus(payment, deposit) &&
      this.verifyTimeMatch(payment, deposit, timeDiff)
    );
  }
  /**
   *
   * @param payments
   * @param deposits
   * @returns
   */
  public matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[],
    timeDiff: number
  ): { payment: PaymentEntity; deposit: POSDepositEntity }[] {
    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];

    payments.forEach((payment: PaymentEntity, pindex: number) =>
      deposits.forEach((deposit: POSDepositEntity, dindex: number) => {
        if (this.verifyMatch(payment, deposit, timeDiff)) {
          payments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          matches.push({
            payment: {
              ...payment,
              status: MatchStatus.MATCH,
              timestamp: payment.timestamp,
              pos_deposit_match: deposit
            },
            deposit: {
              ...deposit,
              status: MatchStatus.MATCH,
              timestamp: deposit.timestamp
            }
          });
        }
      })
    );

    return matches;
  }
  /**
   * @param matches
   * @returns
   */

  public async updateMatchedPaymentsAndDeposits(
    matches: { payment: PaymentEntity; deposit: POSDepositEntity }[]
  ): Promise<void> {
    this.appLogger.log(
      `MATCHES: ${matches.length}`,
      POSReconciliationService.name
    );
    matches.forEach(async (itm) => {
      await this.paymentService.updatePayment(itm.payment);
      await this.posDepositService.update(itm.deposit);
    });
  }
  /**
   * @param exceptions
   */

  public async updateExceptions(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): Promise<void> {
    this.appLogger.log(
      `${payments.length} exceptions`,
      `POSReconciliationService}`
    );
    payments.forEach(
      async (payment) =>
        await this.paymentService.updatePayment({
          ...payment,
          status: MatchStatus.EXCEPTION,
          timestamp: payment.timestamp
        })
    );
    this.appLogger.log(
      `${payments.length} exceptions`,
      `POSReconciliationService}`
    );
    deposits.forEach(
      async (deposit) =>
        await this.posDepositService.update({
          ...deposit,
          status: MatchStatus.EXCEPTION,
          timestamp: deposit.timestamp
        })
    );
  }
  /**
   *
   * @param event
   * @returns
   */

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<unknown | ReconciliationEventError> {
    const pendingPayments = await this.paymentService.findPosPayments(
      event.date,
      event.location,
      MatchStatus.PENDING
    );

    const pendingDeposits = await this.posDepositService.findPOSDeposits(
      event.date,
      event.program,
      event.location,
      MatchStatus.PENDING
    );

    if (pendingPayments.length === 0 || pendingDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found'
      };
    }

    this.appLogger.log(
      `pending payments ${pendingPayments.length}`,
      POSReconciliationService.name
    );

    this.appLogger.log(
      `pending deposits ${pendingDeposits.length}`,
      POSReconciliationService.name
    );

    const roundOneMatches = this.matchPosPaymentToPosDeposits(
      pendingPayments,
      pendingDeposits,
      5
    );

    this.appLogger.log(
      `MATCHES - ROUND ONE ${roundOneMatches.length}`,
      POSReconciliationService.name
    );

    const roundTwoMatches = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING),
      pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING),
      1440
    );

    this.appLogger.log(
      `MATCHES - ROUND TWO ${roundTwoMatches.length}`,
      POSReconciliationService.name
    );
    /**
     * Update database with matches
     */
    await this.updateMatchedPaymentsAndDeposits([
      ...roundOneMatches,
      ...roundTwoMatches
    ]);
    /**
     * Update database with remaining payments and deposits which are unmatched - set as exceptions
     */

    await this.updateExceptions(
      pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING),
      pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING)
    );

    return {
      transaction_date: event.date,
      type: ReconciliationType.POS,
      location_id: event.location.location_id,
      total_deposits_pending: pendingDeposits.length,
      total_payments_pending: pendingPayments.length,
      total_matched_payments: pendingDeposits.filter(
        (itm) => itm.status === MatchStatus.MATCH
      ).length,
      total_matched_deposits: pendingPayments.filter(
        (itm) => itm.status === MatchStatus.MATCH
      ).length
    };
  }
}
