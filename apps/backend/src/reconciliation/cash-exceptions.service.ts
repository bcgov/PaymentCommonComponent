import { Injectable, Inject } from '@nestjs/common';
import { MatchStatus } from '../common/const';
import { Ministries, NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

@Injectable()
export class CashExceptionsService {
  constructor(
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(PaymentService) private paymentService: PaymentService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(CashExceptionsService.name);
  }
  /**
   *
   * @param event
   * @returns PaymentEntity[]
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async setExceptions(
    location: NormalizedLocation,
    program: Ministries,
    exceptionsDate: string,
    currentDate: Date
  ): Promise<{ payments: number; deposits: number }> {
    const payments: PaymentEntity[] =
      await this.paymentService.findPaymentsExceptions(
        location.location_id,
        exceptionsDate
      );

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositExceptions(
        exceptionsDate,
        program,
        location.pt_location_id
      );

    const paymentExceptions: PaymentEntity[] =
      await this.paymentService.updatePayments(
        payments.map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.EXCEPTION,
          reconciled_on: currentDate,
        }))
      );

    const depositExceptions: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(
        deposits.map((itm) => ({
          ...itm,
          status: MatchStatus.EXCEPTION,
          reconciled_on: currentDate,
        }))
      );

    return {
      payments: paymentExceptions?.length ?? 0,
      deposits: depositExceptions?.length ?? 0,
    };
  }
}
