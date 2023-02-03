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
import * as _ from 'underscore';

@Injectable()
export class POSReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  public async setMatched(
    deposit: Partial<POSDepositEntity> | undefined,
    payment: Partial<PaymentEntity> | undefined
  ) {
    if (!deposit || !payment) return;
    return {
      deposit: await this.posDepositService.updatePOSDepositEntity(
        deposit,
        payment
      ),
      payment: await this.transactionService.reconcilePOS(deposit, payment)
    };
  }

  private async match(
    deposits: POSDepositEntity[],
    payments: PaymentEntity[]
  ): Promise<any[]> {
    const filtered = deposits.map((deposit: POSDepositEntity) => ({
      payment: _.findWhere(payments, {
        amount: parseFloat(deposit.transaction_amt.toString()),
        method: deposit.method?.toString()
      }),
      deposit
    }));

    return (
      filtered &&
      (await Promise.all(
        filtered.map(({ deposit, payment }: any) => {
          return this.setMatched(deposit, payment);
        })
      ))
    );
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError> {
    const payments = await this.transactionService.queryPosPayments(event);

    const deposits = await this.posDepositService.findAllByLocationAndDate(
      event
    );

    const matched =
      payments && deposits && (await this.match(deposits, payments));

    return {
      total_deposit: deposits ? deposits.length : 0,
      total_payments: payments ? payments.length : 0,
      total_matched: matched.length
    };
  }
}
