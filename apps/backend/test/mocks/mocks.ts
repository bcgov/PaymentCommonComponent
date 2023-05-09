import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { TransactionMock } from './classes/transaction_mock';
import { generateDateRange } from './const/date_range_mock';
import { generateMetadataMock } from './const/file_metadata_mock';
import { generateLocation } from './const/location_mock';
import { MatchStatus } from '../../src/common/const';
import { aggregatedPayments } from '../../src/common/utils/helpers';
import { DateRange, FileTypes, Ministries } from '../../src/constants';
import { PaymentMethodClassification } from '../../src/constants';
import { LocationEntity } from '../../src/location/entities/master-location-data.entity';

export class MockData {
  public location: LocationEntity;
  public dateRange: DateRange;
  public program: Ministries;
  constructor() {
    this.dateRange = generateDateRange();
    this.program = Ministries.SBC;
    this.location = generateLocation();
  }
}

export class MockPaymentData extends MockData {
  public paymentsMock: PaymentMock[];
  public transactionsMock: TransactionMock[];
  constructor(
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ) {
    super();
    this.transactionsMock = this.generateTransactions(classification, status);
    this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
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
    classification: PaymentMethodClassification,
    status?: MatchStatus
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
        status
      );
      transactions.push(transaction);
    }
    return transactions;
  }
}
export class MockPosData extends MockData {
  paymentsMock: PaymentMock[];
  posDepositsMock: POSDepositMock[];
  constructor() {
    super();
    this.paymentsMock = new MockPaymentData(
      PaymentMethodClassification.POS
    ).paymentsMock;
    this.posDepositsMock = this.paymentsMock.flatMap(
      (payment: PaymentMock) =>
        new POSDepositMock(
          this.location,
          generateMetadataMock(FileTypes.TDI34),
          payment,
          MatchStatus.PENDING
        )
    );
  }
}

export class MockCashData extends MockData {
  paymentsMock: PaymentMock[];
  cashDepositsMock: CashDepositMock[];

  constructor() {
    super();
    this.paymentsMock = new MockPaymentData(
      PaymentMethodClassification.CASH
    ).paymentsMock;
    const paymentTotals = aggregatedPayments(this.paymentsMock).map(
      (itm) => itm.amount
    );
    this.cashDepositsMock = paymentTotals.flatMap(
      (payment_total: number) =>
        new CashDepositMock(
          this.dateRange,
          this.location,
          payment_total,
          MatchStatus.PENDING
        )
    );
  }
}
