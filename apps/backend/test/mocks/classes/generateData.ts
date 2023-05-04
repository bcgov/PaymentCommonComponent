import { CashDepositMock } from './cash_deposit_mock';
import { PaymentMock } from './payment_mock';
import { POSDepositMock } from './pos_deposit_mock';
import { TransactionMock } from './transaction_mock';
import { generateDateRange } from '../const/date_range_mock';
import { generateLocation } from '../const/location_mock';
import { MatchStatus } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { DateRange, Ministries } from '../../../src/constants';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';

export class MockData {
  public posDepositsMock: POSDepositMock[];
  public paymentsMock: PaymentMock[];
  public cashDepositsMock: CashDepositMock[];
  public transactionsMock: TransactionMock[];
  public location: LocationEntity;
  public dateRange: DateRange;
  public program: Ministries;

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
  constructor(
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ) {
    this.dateRange = generateDateRange();
    this.program = Ministries.SBC;
    this.location = generateLocation();

    this.transactionsMock = this.generateTransactions(classification, status);
    this.paymentsMock = this.transactionsMock.flatMap((itm) => itm.payments);
  }
}
