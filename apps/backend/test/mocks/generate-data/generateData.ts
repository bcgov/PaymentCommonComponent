import { BaseData } from './classes/base-data';
import { CashDeposit } from './classes/cash-deposit';
import { getDateRange } from './classes/date-range';
import { getLocation } from './classes/location';
import { Payment } from './classes/payment';
import { POSDeposit } from './classes/pos-deposit';
import { Transaction } from './classes/transaction';
import { Ministries } from '../../../src/constants';

export class GenerateData {
  public readonly data: BaseData;

  public generatePayments(): Payment[] {
    const payments = [];
    for (let i = 0; i < 3; i++) {
      payments.push(this.generatePayment());
    }
    return payments;
  }

  public generatePayment(): Payment {
    return new Payment();
  }

  public generateTransactions(baseData: BaseData): Transaction[] {
    const transactions = [];
    for (let i = 0; i < 10; i++) {
      const payments = this.generatePayments();
      const transaction = this.generateTransaction(baseData, payments);
      transactions.push(transaction);
    }
    return transactions;
  }

  public generateBaseData(): BaseData {
    const dateRange = getDateRange();
    const location = getLocation();

    return new BaseData(dateRange, location, Ministries.SBC);
  }

  public generateTransaction(
    baseData: BaseData,
    payments: Payment[]
  ): Transaction {
    return new Transaction(baseData, payments);
  }

  public generateCashDeposit(baseData: BaseData, amount: number): CashDeposit {
    return new CashDeposit(baseData, amount);
  }

  public generatePOSDeposit(
    baseData: BaseData,
    payment: Payment,
    transaction: Transaction
  ): POSDeposit {
    return new POSDeposit(baseData, payment, transaction);
  }
}
