import { Injectable, Inject, Logger } from '@nestjs/common';
import { MatchStatus } from '../common/const';
import { Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

@Injectable()
export class CashExceptionsService {
  constructor(
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(PaymentService) private paymentService: PaymentService,
    private appLogger: AppLogger
  ) {
    this.appLogger.setContext(`CashExceptionsService`);
  }
  /**
   *
   * @param event
   * @returns PaymentEntity[]
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async findExceptions(
    location: LocationEntity,
    program: Ministries,
    exceptionsDate: string
  ): Promise<{ payments: number; deposits: number }> {
    const payments: PaymentEntity[] =
      await this.paymentService.findPaymentsExceptions(
        location,
        exceptionsDate
      );

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositExceptions(
        exceptionsDate,
        program,
        location
      );

    const paymentExceptions: PaymentEntity[] =
      await this.paymentService.updatePayments(
        payments.map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.EXCEPTION,
        }))
      );

    const depositExceptions: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(
        deposits.map((itm) => ({
          ...itm,
          status: MatchStatus.EXCEPTION,
        }))
      );

    return {
      payments: paymentExceptions?.length ?? 0,
      deposits: depositExceptions?.length ?? 0,
    };
  }
}
