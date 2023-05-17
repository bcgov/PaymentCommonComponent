import { Injectable, Inject } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { ReconciliationType } from './types';
import { MatchStatus } from '../common/const';
import { Ministries } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(PaymentService) private paymentService: PaymentService,
    private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(`POSReconciliationService`);
  }

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
    return payment.payment_method.method === deposit.payment_method.method;
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

    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        if (this.verifyMatch(payment, deposit, timeDiff)) {
          payments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          matches.push({
            payment: {
              ...payment,
              status: MatchStatus.MATCH,
              timestamp: payment.timestamp,
              pos_deposit_match: {
                ...deposit,
                timestamp: deposit.timestamp,
                status: MatchStatus.MATCH,
              },
            },
            deposit: {
              ...deposit,
              status: MatchStatus.MATCH,
              timestamp: deposit.timestamp,
            },
          });
          break;
        }
      }
    }

    return matches;
  }

  /**
   *
   * @param event
   * @returns
   */

  public async reconcile(
    location: LocationEntity,
    program: Ministries,
    date: string
  ): Promise<unknown> {
    const pendingPayments = await this.paymentService.findPosPayments(
      date,
      location,
      MatchStatus.PENDING
    );

    const pendingDeposits = await this.posDepositService.findPOSDeposits(
      date,
      program,
      location,
      MatchStatus.PENDING
    );

    if (pendingPayments.length === 0 && pendingDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    this.appLogger.log(`pending payments ${pendingPayments.length}`);

    this.appLogger.log(`pending deposits ${pendingDeposits.length}`);

    const roundOneMatches: {
      payment: PaymentEntity;
      deposit: POSDepositEntity;
    }[] = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING),
      pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING),
      5
    );

    this.appLogger.log(`MATCHES - ROUND ONE ${roundOneMatches.length}`);

    const roundTwoMatches: {
      payment: PaymentEntity;
      deposit: POSDepositEntity;
    }[] = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING),
      pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING),
      1440
    );

    this.appLogger.log(`MATCHES - ROUND TWO ${roundTwoMatches.length}`);

    const paymentsMatched = await Promise.all(
      await this.paymentService.updatePayments(
        [...roundOneMatches, ...roundTwoMatches].map((itm) => itm.payment)
      )
    );

    const depositsMatched = await Promise.all(
      await this.posDepositService.updateDeposits(
        [...roundOneMatches, ...roundTwoMatches].map((itm) => itm.deposit)
      )
    );

    const paymentExceptions = await Promise.all(
      await this.paymentService.updatePayments(
        pendingPayments
          .filter((itm) => itm.status === MatchStatus.PENDING)
          .map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.EXCEPTION,
          }))
      )
    );
    const depositExcpetions = await Promise.all(
      await this.posDepositService.updateDeposits(
        pendingDeposits
          .filter((itm) => itm.status === MatchStatus.PENDING)
          .map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.EXCEPTION,
          }))
      )
    );

    return {
      transaction_date: date,
      type: ReconciliationType.POS,
      location_id: location.location_id,
      total_deposits_pending: pendingDeposits.length,
      total_payments_pending: pendingPayments.length,
      total_matched_payments: paymentsMatched.length,
      total_matched_deposits: depositsMatched.length,
      total_payment_exceptions: paymentExceptions.length,
      total_deposit_exceptions: depositExcpetions.length,
    };
  }
}
