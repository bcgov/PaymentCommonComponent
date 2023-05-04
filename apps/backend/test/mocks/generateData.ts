import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { TransactionMock } from './classes/transaction_mock';
import { generateDateRange } from './const/date_range_mock';
import { generateMetadataMock } from './const/file_metadata_mock';
import { generateLocation } from './const/location_mock';
import { FileMetadata } from './../../src/common/columns/metadata';
import { MatchStatus } from './../../src/common/const';
import { FileTypes, PaymentMethodClassification } from './../../src/constants';
import { LocationEntity } from './../../src/location/entities/master-location-data.entity';
import { aggregatedPayments } from '../../src/common/utils/helpers';
import { DateRange, Ministries } from '../../src/constants';

export class MockData {
  public posDepositsMock: POSDepositMock[];
  public paymentsMock: PaymentMock[];
  public cashDepositsMock: CashDepositMock[];
  public transactionsMock: TransactionMock[];

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
    dateRange: DateRange,
    program: Ministries,
    location: LocationEntity,
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ): TransactionMock[] {
    const transactions = [];

    for (let i = 0; i < 10; i++) {
      const transaction = new TransactionMock(dateRange, program, location, []);
      transaction.payments = this.generatePayments(
        classification,
        transaction,
        status
      );
      transactions.push(transaction);
    }
    return transactions;
  }
  constructor(
    dateRange: DateRange,
    program: Ministries,
    location: LocationEntity,
    metadata: FileMetadata,
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ) {
    if (classification === PaymentMethodClassification.CASH) {
      this.transactionsMock = this.generateTransactions(
        dateRange,
        program,
        location,
        classification,
        status
      );
      this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
      const paymentTotals = aggregatedPayments(this.paymentsMock).map(
        (itm) => itm.amount
      );
      this.cashDepositsMock = paymentTotals.flatMap(
        (payment_total: number) =>
          new CashDepositMock(dateRange, location, payment_total, status)
      );
    }
    if (classification === PaymentMethodClassification.POS) {
      this.transactionsMock = this.generateTransactions(
        dateRange,
        program,
        location,
        classification,
        status
      );
      this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
      this.posDepositsMock = this.paymentsMock.map(
        (payment: PaymentMock) =>
          new POSDepositMock(location, metadata, payment, status)
      );
    }
  }
}
export const mockCashData = new MockData(
  generateDateRange(),
  Ministries.SBC,
  generateLocation(),
  generateMetadataMock(FileTypes.TDI17),
  PaymentMethodClassification.CASH,
  MatchStatus.PENDING
);
console.log(
  mockCashData.cashDepositsMock.map((itm) => ({
    date: itm.deposit_date,
    amount: itm.deposit_amt_cdn
  })),
  aggregatedPayments(mockCashData.paymentsMock).map((itm) => ({
    date: itm.fiscal_close_date,
    amount: itm.amount
  }))
);

export const mockPosData = new MockData(
  generateDateRange(),
  Ministries.SBC,
  generateLocation(),
  generateMetadataMock(FileTypes.TDI34),
  PaymentMethodClassification.POS,
  MatchStatus.PENDING
);

console.log(
  mockPosData.posDepositsMock.map((itm) => ({
    amount: itm.transaction_amt,
    date: itm.transaction_date
  })),
  mockPosData.paymentsMock.map((itm) => ({
    amount: itm.amount,
    date: itm.transaction.transaction_date
  }))
);
