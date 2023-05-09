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
});
