import { Injectable, Inject, Logger } from '@nestjs/common';
import { AppLogger } from './../common/logger.service';
import { CashDepositService } from '../deposits/cash-deposit.service';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { CashDepositEntity } from './../deposits/entities/cash-deposit.entity';
import { SalesService } from '../sales/sales.service';
import * as _ from 'underscore';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private logger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(SalesService) private salesService: SalesService
  ) {}

  public async setMatched(
    deposit: Partial<CashDepositEntity>,
    payment: Partial<PaymentEntity>
  ) {
    if (!payment || !deposit) return;
    return {
      deposit: await this.cashDepositService.reconcileCash(deposit, payment),
      payment: payment?.id?.split(',').map(async (itm) => {
        return await this.salesService.reconcileCash(deposit, {
          ...payment,
          id: itm
        });
      })
    };
  }

  public async match(deposits: CashDepositEntity[], payments: PaymentEntity[]) {
    const matched = deposits.map((itm: CashDepositEntity) => ({
      payment: _.findWhere(payments, {
        amount: parseFloat(itm.deposit_amt_cdn.toString())
      }),
      deposit: itm
    }));

    return (
      matched &&
      (await Promise.all(
        matched.map(({ deposit, payment }: any) => {
          return this.setMatched(deposit, payment);
        })
      ))
    );
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const deposit_dates = await this.cashDepositService.getCashDates(event);
    if (!deposit_dates.current && deposit_dates.previous)
      return { error: 'Deposit dates are required' };

    const payments = await this.salesService.queryCashPayments(
      event,
      deposit_dates
    );

    const deposits = await this.cashDepositService.query(event, deposit_dates);

    const matched = await Promise.all(await this.match(deposits, payments));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments.length,
      total_matched: matched.length
    };
  }
}
