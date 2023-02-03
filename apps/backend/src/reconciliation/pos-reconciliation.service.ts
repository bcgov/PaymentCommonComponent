import { Injectable, Logger, Inject } from '@nestjs/common';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { POSDepositEntity } from './../deposits/entities/pos-deposit.entity';
import { TransactionService } from '../transaction/transaction.service';
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
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  private async match(
    deposits: POSDepositEntity[],
    payments: PaymentEntity[]
  ): Promise<any[]> {
    return deposits.map(async (deposit: POSDepositEntity) => {
      const payment = payments.find(
        (itm) =>
          itm.amount == parseFloat(deposit.transaction_amt.toString()) &&
          itm.method == deposit.card_vendor
      );
      if (payment) {
        return {
          deposit: await this.posDepositService.updatePOSDepositEntity(
            deposit,
            payment
          ),
          payment: await this.transactionService.reconcilePOS(deposit, payment)
        };
      }
    });
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.transactionService.queryPosPayments(event);

    const deposits = await this.posDepositService.findPOSDeposits(event);

    const matched =
      payments &&
      deposits &&
      (await Promise.all(await this.match(deposits, payments)));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments ? payments.length : 0,
      matched
    };
  }
}
