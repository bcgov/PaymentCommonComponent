import { BaseData } from './classes/base-data';
import { CashDeposit } from './classes/cash-deposit';
import { Payment } from './classes/payment';
import { POSDeposit } from './classes/pos-deposit';
import { Transaction } from './classes/transaction';
import { GenerateData } from './generateData';

/*eslint-disable */
export interface MockData {
  cashdeposit: CashDeposit;
  posDeposits: POSDeposit[];
  transactions: Transaction[];

  total_pos: any;
  total_cash: any;
  total: any;
}
export interface MockReconciliationData {
  mockdata: MockData[];
  baseData: BaseData;
}

export const generate = () => {
  const data = new GenerateData();
  const baseData: BaseData = data.generateBaseData();
  const mockReconciliationData: MockReconciliationData = {
    mockdata: [],
    baseData: baseData
  };
  /*eslint-disable */
  for (let i = 0; i < 10; i++) {
    const transactions = data.generateTransactions(baseData);
    const posDeposits: POSDeposit[] = [];
    transactions.flatMap((transaction: Transaction) =>
      transaction.payments
        .filter((itm: Payment) =>
          [11, 12, 13, 17].includes(itm.payment_method.sbc_code)
        )
        .map((payment: Payment) =>
          posDeposits.push(
            data.generatePOSDeposit(baseData, payment, transaction)
          )
        )
    );
    const cashdeposit = data.generateCashDeposit(
      baseData,
      transactions
        .flatMap((itm) =>
          itm.payments.filter((payment) =>
            [1, 2, 9, 14, 15].includes(payment.payment_method.sbc_code)
          )
        )
        .reduce((acc, itm) => (acc += itm.amount), 0)
    );
    const total_pos = transactions
      .flatMap((itm) =>
        itm.payments.filter((payment) =>
          [11, 12, 13, 17].includes(payment.payment_method.sbc_code)
        )
      )
      .reduce((acc: any, itm: Payment) => (acc += itm.amount), 0);
    const total_cash = transactions
      .flatMap((itm) =>
        itm.payments.filter((payment) =>
          [1, 2, 9, 14, 15].includes(payment.payment_method.sbc_code)
        )
      )
      .reduce((acc: any, itm: Payment) => (acc += itm.amount), 0);
    const total = total_pos + total_cash;
    mockReconciliationData.mockdata.push({
      cashdeposit,
      posDeposits,
      transactions,
      total_pos,
      total_cash,
      total
    });
  }
  return mockReconciliationData;
};
