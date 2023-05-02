import { AggregatedPayment } from 'src/reconciliation/types';
import { CashDeposit } from './classes/cash_deposit_mock';
import { Payment } from './classes/payment_mock';
import { POSDeposit } from './classes/pos_deposit_mock';
import { Transaction } from './classes/transaction_mock';
import { getDateRange } from './const/date_range_mock';
import { BaseData } from './types/interface';
import { MatchStatus } from './../../src/common/const';
import { PaymentMethodClassification } from './../../src/constants';
import { CashDepositEntity } from './../../src/deposits/entities/cash-deposit.entity';
import { LocationEntity } from './../../src/location/entities/master-location-data.entity';
import { PaymentEntity } from './../../src/transaction/entities/payment.entity';
import { DateRange, Ministries } from '../../src/constants';
export class MockData {
  public readonly dateRange: DateRange;
  public readonly program: Ministries;
  public readonly location: LocationEntity;
  public readonly baseData: BaseData;
  public readonly cashDeposits: CashDepositEntity[];
  public readonly posDeposits: POSDeposit[];
  public readonly transactions: Transaction[];
  public readonly payments: Payment[];

  public cashDepositsMock(baseData: BaseData, payments: PaymentEntity[]) {
    return this.generateCashDeposits(baseData, payments);
  }
  public posDepositsMock(baseData: BaseData) {
    return this.generatePOSDeposits(baseData);
  }
  public transactionsMock(
    classification: PaymentMethodClassification,
    baseData: BaseData
  ) {
    return this.generateTransactions(baseData, classification);
  }
  public generatePayments(
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ): Payment[] {
    const payments = [];
    for (let i = 0; i < 3; i++) {
      payments.push(this.generatePayment(classification, status));
    }
    return payments;
  }

  public generatePayment(
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ): Payment {
    return new Payment(classification, status);
  }

  public generateTransactions(
    baseData: BaseData,
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ): Transaction[] {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      const payments = this.generatePayments(classification, status);
      const transaction = this.generateTransaction(baseData, payments);
      transactions.push(transaction);
    }
    return transactions;
  }

  public generateTransaction(
    baseData: BaseData,
    payments: Payment[]
  ): Transaction {
    return new Transaction(baseData, payments);
  }

  public generateCashDeposit(
    baseData: BaseData,
    amount: number,
    status?: MatchStatus
  ): CashDeposit {
    return new CashDeposit(baseData, amount, status);
  }
  public aggPayments(payments: PaymentEntity[]) {
    const groupedPayments = payments.reduce(
      /*eslint-disable */
      (acc: any, payment: PaymentEntity) => {
        const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
        if (!acc[key]) {
          acc[key] = {
            status: payment.status,
            fiscal_close_date: payment.transaction.fiscal_close_date,
            amount: 0,
            payments: []
          };
        }
        acc[key].amount += parseFloat(payment.amount.toFixed(2));
        acc[key].payments.push(payment);
        return acc;
      },
      {}
    );
    const aggPayments: AggregatedPayment[] = Object.values(groupedPayments);
    return aggPayments.sort(
      (a: AggregatedPayment, b: AggregatedPayment) => a.amount - b.amount
    );
  }
  public generateCashDeposits(
    baseData: BaseData,
    payments: PaymentEntity[],
    status?: MatchStatus
  ): CashDepositEntity[] {
    const cashDeposits: CashDepositEntity[] = [];
    let amount = 0;
    const paymentTotals = this.aggPayments(payments).map((itm) => itm.amount);
    paymentTotals.forEach((itm: number) => {
      const deposit: CashDepositEntity = this.generateCashDeposit(
        baseData,
        itm,
        status
      );
      cashDeposits.push(deposit);
    });
    return cashDeposits;
  }
  public generatePOSDeposit(
    baseData: BaseData,
    payment: Payment,
    transaction: Transaction,
    status?: MatchStatus
  ): POSDeposit {
    return new POSDeposit(baseData, payment, transaction, status);
  }
  public generatePOSDeposits(
    baseData: BaseData,
    status?: MatchStatus
  ): POSDeposit[] {
    const posDeposits = [];

    for (let i = 0; i < 10; i++) {
      const deposit = this.generatePOSDeposit(
        baseData,
        this.generatePayment(PaymentMethodClassification.POS),
        this.generateTransaction(
          baseData,
          this.generatePayments(PaymentMethodClassification.POS, status)
        )
      );
      posDeposits.push(deposit);
    }
    return posDeposits;
  }
}

export const generateData = (
  location: LocationEntity,
  program: Ministries,
  status?: MatchStatus
): MockData[] => {
  const mockData: MockData[] = [];
  let dateRange;

  for (let i = 0; i <= 3; i++) {
    dateRange = getDateRange();

    const data = new MockData();

    mockData.push(data);
  }
  return mockData;
};
