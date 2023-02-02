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

  private async match(
    deposits: CashDepositEntity[],
    payments: PaymentEntity[]
  ) {
    const matched = payments.map((payment: PaymentEntity) => {
      const deposit = deposits.find(
        (deposit: CashDepositEntity) =>
          parseFloat(deposit.deposit_amt_cdn?.toString()) ===
          parseFloat(payment.amount?.toString())
      );
      return { deposit, payment };
    });

    const set_matched = (await Promise.all(matched)).map(
      async ({ deposit, payment }) => {
        if (deposit) {
          return {
            payment: await this.salesService.reconcile(payment, deposit),
            deposit: await this.cashDepositService.reconcile(payment, deposit)
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
    const deposits = await this.cashDepositService.query(event);

    const { matched } =
      payments && deposits && (await this.match(deposits, payments));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments.length,
      total_deposit_amt: deposits.reduce(
        (total: number, deposit: CashDepositEntity) =>
          total + deposit.deposit_amt_cdn,
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
