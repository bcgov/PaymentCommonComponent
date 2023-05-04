import { differenceInHours } from 'date-fns';
import { CashDepositMock } from './classes/cash_deposit_mock';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { MockCashData, MockPosData } from './mocks';
import { aggregatedPayments } from './../../src/common/utils/helpers';

describe('Tests the generated mock data', () => {
  let cashDepositsMock: CashDepositMock[];
  let cashPaymentsMock: PaymentMock[];
  let posPaymentsMock: PaymentMock[];
  let posDepositsMock: POSDepositMock[];

  beforeEach(() => {
    const mockCashData = new MockCashData();
    cashDepositsMock = mockCashData.cashDepositsMock;
    cashPaymentsMock = mockCashData.paymentsMock;
    const mockPOSData = new MockPosData();
    posPaymentsMock = mockPOSData.paymentsMock;
    posDepositsMock = mockPOSData.posDepositsMock;
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
          differenceInHours(new Date(deposit.date), new Date(payment.date))
        ).toBeGreaterThan(0)
      )
    );
  });
  it('should generate pos payments and deposits with the same date and amount', () => {
    const expectedPOSDeposits = posDepositsMock.map((itm) => ({
      date: itm.transaction_date,
      amount: itm.transaction_amt
    }));
    const expectedPOSPayments = posPaymentsMock.map((itm) => ({
      date: itm.transaction.transaction_date,
      amount: itm.amount
    }));
    expectedPOSDeposits.forEach((deposit) =>
      expect(
        expectedPOSPayments.find(
          (payment) =>
            payment.date === deposit.date && payment.amount === deposit.amount
        )
      ).toBeTruthy()
    );
  });
});
