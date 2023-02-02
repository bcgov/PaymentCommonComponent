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

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private logger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(SalesService) private salesService: SalesService
  ) {}

  private async setMatched(
    deposit: CashDepositEntity | undefined,
    payment: PaymentEntity | undefined
  ) {
    if (!payment || !deposit) return;
    return {
      deposit: await this.cashDepositService.reconcile(payment, deposit),
      payment: payment.id
        .split(',')
        .forEach((itm) =>
          this.salesService.reconcile({ ...payment, id: itm }, deposit)
        )
    };
  }
  private async match(
    deposits: CashDepositEntity[],
    payments: PaymentEntity[]
  ) {
    return payments.map(async (payment: PaymentEntity) => {
      return await this.setMatched(
        deposits.find(
          (deposit: CashDepositEntity) =>
            parseFloat(deposit.deposit_amt_cdn?.toString()) ===
            parseFloat(payment.amount?.toString())
        ),
        payment
      );
    });
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.salesService.queryTransactions(event);
    const deposits = await this.cashDepositService.query(event);

    const matched = await this.match(deposits, payments);

    return {
      event_type: event.type,
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments.length,
      total_matched: matched.length
    };
  }
}
