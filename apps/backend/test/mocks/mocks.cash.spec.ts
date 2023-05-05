import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { MockCashData } from './mocks';
import { aggregatedPayments } from './../../src/common/utils/helpers';

describe('Tests the generated mock data', () => {
  let cashDepositsMock: CashDepositMock[];
  let cashPaymentsMock: PaymentMock[];

  beforeEach(() => {
    const mockCashData = new MockCashData();
    cashDepositsMock = mockCashData.cashDepositsMock;
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
});
