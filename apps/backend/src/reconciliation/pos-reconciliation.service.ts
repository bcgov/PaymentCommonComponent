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

  private async match(deposits: POSDepositEntity[], payments: PaymentEntity[]) {
    const matched = payments.map((payment: PaymentEntity) => {
      const deposit = deposits.find(
        (deposit: POSDepositEntity) =>
          parseFloat(deposit.transaction_amt.toString()) ===
          parseFloat(payment.amount.toString())
      );
      return { deposit, payment };
    });

    const set_matched = (await Promise.all(matched)).forEach(
      async ({ deposit, payment }) => {
        if (deposit) {
          return {
            payment: await this.salesService.reconcile(payment, deposit),
            deposit: await this.posDepositService.reconcile(payment, deposit)
          };
        }
      }
    );
    return { matched, set_matched };
  }

  async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.salesService.queryTransactions(event);
    const deposits = await this.posDepositService.query(event);

    const { matched } =
      payments && deposits && (await this.match(deposits, payments));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments.length,
      total_deposit_amt: deposits.reduce(
        (total: number, deposit: POSDepositEntity) =>
          total + parseFloat(deposit.transaction_amt.toString()),
        0
      ),
      total_payments_amt: payments.reduce(
        (total: number, payment: PaymentEntity) =>
          total + parseFloat(payment.amount.toString()),
        0
      ),
      total_matched: matched.length,
      matched
    };
  }
}
