import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { TransactionMock } from './classes/transaction_mock';
import { generateDateRange } from './const/date_range_mock';
import { generateMetadataMock } from './const/file_metadata_mock';
import { generateLocation } from './const/location_mock';
import { aggregatePayments } from '../unit/reconciliation/helpers';
import { MatchStatus } from '../../src/common/const';
import { DateRange, FileTypes, Ministries } from '../../src/constants';
import { PaymentMethodClassification } from '../../src/constants';
import { LocationEntity } from '../../src/location/entities/master-location-data.entity';
import { AggregatedPayment } from '../../src/reconciliation/types';
import { PaymentEntity } from '../../src/transaction/entities';

export class MockData {
  public location: LocationEntity;
  public dateRange: DateRange;
  public program: Ministries;
  public paymentsMock: PaymentMock[];
  public transactionsMock: TransactionMock[];
  public depositsMock: CashDepositMock[] | POSDepositMock[];
  public classification: PaymentMethodClassification;
  public status: MatchStatus;

  constructor(classification: PaymentMethodClassification) {
    this.classification = classification;
    this.dateRange = generateDateRange();
    this.location = generateLocation();
    this.program = Ministries.SBC;
    this.status = MatchStatus.PENDING;
    this.transactionsMock = this.generateTransactions(classification);
    this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
    this.depositsMock =
      classification === PaymentMethodClassification.CASH
        ? this.generateCashDeposits(this.paymentsMock)
        : this.generatePosDeposits();
  }

  generateCashDeposits(payments: PaymentEntity[]): CashDepositMock[] {
    const aggregatedPayments = aggregatePayments(payments);
    const cashDeposits: CashDepositMock[] = [];
    aggregatedPayments.forEach((payment: AggregatedPayment) => {
      cashDeposits.push(
        new CashDepositMock(
          this.dateRange,
          this.location,
          generateMetadataMock(FileTypes.TDI17),
          payment.amount,
          this.status
        )
      );
    });
    return cashDeposits;
  }

  public generatePosDeposits(): POSDepositMock[] {
    return this.paymentsMock.flatMap(
      (payment: PaymentMock) =>
        new POSDepositMock(
          this.location,
          generateMetadataMock(FileTypes.TDI34),
          payment,
          this.status
        )
    );
  }
  public generatePayments(
    classification: PaymentMethodClassification,
    transaction: TransactionMock,
    status?: MatchStatus
  ): PaymentMock[] {
    const payments = [];
    for (let i = 0; i < 3; i++) {
      payments.push(new PaymentMock(classification, transaction, status));
    }
    return payments;
  }

  public generateTransactions(
    classification: PaymentMethodClassification
  ): TransactionMock[] {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      const transaction = new TransactionMock(
        this.dateRange,
        this.program,
        this.location,
        []
      );
      transaction.payments = this.generatePayments(
        classification,
        transaction,
        this.status
      );
      transactions.push(transaction);
    }
    return transactions;
  }
}
