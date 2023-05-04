import { compareAsc } from 'date-fns';
import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { MockData } from './mocks';
import { aggregatedPayments } from './../../src/common/utils/helpers';
import { PaymentMethodClassification } from '../../src/constants';

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
        amount: itm.deposit_amt_cdn
      })),
      payments: aggregatedPayments(cashPaymentsMock).map((itm) => ({
        date: itm.fiscal_close_date,
        amount: itm.amount
      }))
    };
    expect(expected.payments.map((itm) => itm.amount)).toEqual(
      expected.deposits.map((itm) => itm.amount)
    );
  });

  it('should generate cash deposits with a date greater than the date of the last payment', () => {
    const expected = {
      deposits: cashDepositsMock.map((itm) => ({
        date: itm.deposit_date,
        amount: itm.deposit_amt_cdn
      })),
      payments: aggregatedPayments(cashPaymentsMock).map((itm) => ({
        date: itm.fiscal_close_date,
        amount: itm.amount
      }))
    };
    expected.deposits.forEach((deposit) =>
      expected.payments.forEach((payment) =>
        expect(
          // Compare the two dates and return 1 if the first date is after the second, -1 if the first date is before the second or 0 if dates are equal.
          compareAsc(new Date(deposit.date), new Date(payment.date))
        ).toEqual(1)
      )
    );
  });
});
