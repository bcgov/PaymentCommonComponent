import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { TransactionMock } from './classes/transaction_mock';
import { generateDateRange } from './const/date_range_mock';
import { generateMetadataMock } from './const/file_metadata_mock';
import { generateLocation } from './const/location_mock';
import { aggregatedPayments } from '../unit/reconciliation/helpers';
import { MatchStatus } from '../../src/common/const';
import { DateRange, FileTypes, Ministries } from '../../src/constants';
import { PaymentMethodClassification } from '../../src/constants';
import { LocationEntity } from '../../src/location/entities/master-location-data.entity';

export class MockData {
  public location: LocationEntity;
  public dateRange: DateRange;
  public program: Ministries;
  public paymentsMock: PaymentMock[];
  public transactionsMock: TransactionMock[];
  public depositsMock: CashDepositMock[] | POSDepositMock[];
  public classification: PaymentMethodClassification;
  public status: MatchStatus;

  constructor(
    classification: PaymentMethodClassification,
    dateRange?: DateRange,
    location?: LocationEntity,
    program?: Ministries,
    status?: MatchStatus
  ) {
    this.classification = classification;
    this.dateRange = dateRange ?? generateDateRange();
    this.location = location ?? generateLocation();
    this.program = program ?? Ministries.SBC;
    this.status = status ?? MatchStatus.PENDING;
    this.transactionsMock = this.generateTransactions();
    this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
    this.setDepositsMock();
  }

  generateCashDeposits(): CashDepositMock[] {
    const paymentTotals = aggregatedPayments(this.paymentsMock).map(
      (itm) => itm.amount
    );
    return paymentTotals.flatMap(
      (payment_total: number) =>
        new CashDepositMock(
          this.dateRange,
          this.location,
          payment_total,
          this.status
        )
    );
  }
  public setDepositsMock() {
    this.classification === PaymentMethodClassification.CASH
      ? (this.depositsMock = this.generateCashDeposits())
      : (this.depositsMock = this.generatePosDeposits());
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

  public generateTransactions(): TransactionMock[] {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      const transaction = new TransactionMock(
        this.dateRange,
        this.program,
        this.location,
        []
      );
      transaction.payments = this.generatePayments(
        this.classification,
        transaction,
        this.status
      );
      transactions.push(transaction);
    }
    return transactions;
  }
}
