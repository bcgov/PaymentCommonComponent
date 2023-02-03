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

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private logger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  private async match(
    deposits: CashDepositEntity[],
    payments: PaymentEntity[]
  ): Promise<any[]> {
    return deposits.map(async (deposit: CashDepositEntity) => {
      const payment = payments.find(
        (itm) => itm.amount == parseFloat(deposit.deposit_amt_cdn.toString())
      );
      if (payment) {
        return {
          deposit: await this.cashDepositService.updateCashDepositEntity(
            deposit,
            payment
          ),
          payment: payment?.id?.split(',').map(async (itm) => {
            return await this.transactionService.reconcileCash(deposit, {
              ...payment,
              id: itm
            });
          })
        };
      }
    });
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const deposit_dates = await this.cashDepositService.getCashDates(event);
    if (!deposit_dates.current && deposit_dates.previous)
      return { error: 'Deposit dates are required' };

    const payments = await this.transactionService.queryCashPayments(
      event,
      deposit_dates
    );

    const deposits = await this.cashDepositService.query(event, deposit_dates);

    const matched = await Promise.all(await this.match(deposits, payments));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments.length,
      matched
    };
  }
}
