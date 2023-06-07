import { compareAsc, parse } from 'date-fns';
import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { MockData } from './mocks';
import { aggregatePayments } from '../unit/reconciliation/helpers';
import { PaymentMethodClassification } from '../../src/constants';
import { AggregatedCashPayment } from '../../src/reconciliation/types';

describe('Tests the generated mock data', () => {
  let cashDepositsMock: CashDepositMock[];
  let cashPaymentsMock: PaymentMock[];

  beforeEach(() => {
    const mockCashData = new MockData(PaymentMethodClassification.CASH);
    cashDepositsMock = mockCashData.depositsMock as CashDepositMock[];
    cashPaymentsMock = mockCashData.paymentsMock;

    jest.resetModules();
  });

  it('should generate the cash deposit amount as the sum of payments per fiscal_close_date', () => {
    const expected = {
      deposits: cashDepositsMock.map((itm) => ({
        date: itm.deposit_date,
        amount: itm.deposit_amt_cdn,
      })),
      payments: aggregatePayments(cashPaymentsMock).map((itm) => ({
        date: itm.fiscal_close_date,
        amount: itm.amount,
      })),
    };
    expect(expected.payments.map((itm) => itm.amount.toString())).toEqual(
      expected.deposits.map((itm) => itm.amount.toString())
    );
  });

  it('should generate cash deposits with a date greater than the payment dates', () => {
    const depositsDates = cashDepositsMock.map((itm) =>
      parse(itm.deposit_date, 'yyyy-MM-dd', new Date())
    );
    const paymentsDates = aggregatePayments(cashPaymentsMock).map(
      (itm: AggregatedCashPayment) =>
        parse(itm.fiscal_close_date, 'yyyy-MM-dd', new Date())
    );
    // compareAsc returns -1 if the first date is before the second date, which causes this function to fail
    expect(
      depositsDates.every((depositDate) =>
        paymentsDates.every(
          (paymentDate) => compareAsc(depositDate, paymentDate) === 1
        )
      )
    ).toBe(true);
  });
});
