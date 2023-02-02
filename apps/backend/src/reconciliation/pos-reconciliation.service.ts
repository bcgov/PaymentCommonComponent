import { Injectable, Logger, Inject } from '@nestjs/common';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { POSDepositEntity } from './../deposits/entities/pos-deposit.entity';
import { SalesService } from '../sales/sales.service';
import { AppLogger } from '../common/logger.service';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError
} from './const';
import { PosDepositService } from '../deposits/pos-deposit.service';
@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(SalesService) private salesService: SalesService
  ) {}

  private async match(
    deposits: POSDepositEntity[],
    payments: PaymentEntity[]
  ): Promise<any[]> {
    return payments.map(async (payment: PaymentEntity) => {
      return await this.setMatched(
        deposits.find(
          (deposit: POSDepositEntity) =>
            parseFloat(deposit.transaction_amt.toString()) ===
            parseFloat(payment.amount.toString())
        ),
        payment
      );
    });
  }
  private async setMatched(
    deposit: POSDepositEntity | undefined,
    payment: PaymentEntity | undefined
  ) {
    if (!payment || !deposit) return;
    return {
      deposit: await this.posDepositService.reconcile(payment, deposit),
      payment: await this.salesService.reconcile(payment, deposit)
    };
  }
  async reconcile(
    event: ReconciliationEvent,
    merchant_ids: number[]
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.salesService.queryTransactions(event);
    const deposits = await this.posDepositService.query(event, merchant_ids);
    const matched = await Promise.all(await this.match(deposits, payments));

    return {
      event_type: event.type,
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments ? payments.length : 0,
      total_matched: matched.length
    };
  }
}
