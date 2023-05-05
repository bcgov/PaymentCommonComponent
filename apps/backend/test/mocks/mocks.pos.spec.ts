import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { MockPosData } from './mocks';

describe('Tests the generated mock data', () => {
  let posPaymentsMock: PaymentMock[];
  let posDepositsMock: POSDepositMock[];

  beforeEach(() => {
    const mockPOSData = new MockPosData();
    posPaymentsMock = mockPOSData.paymentsMock;
    posDepositsMock = mockPOSData.posDepositsMock;
    jest.resetModules();
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
