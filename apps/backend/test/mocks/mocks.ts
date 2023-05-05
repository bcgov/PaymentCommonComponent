import { CashDepositMock } from './classes/cash_deposit_mock';
import { MockData } from './classes/generateData';
import { PaymentMock } from './classes/payment_mock';
import { POSDepositMock } from './classes/pos_deposit_mock';
import { generateMetadataMock } from './const/file_metadata_mock';
import { MatchStatus } from '../../src/common/const';
import { aggregatedPayments } from '../../src/common/utils/helpers';
import { PaymentMethodClassification, FileTypes } from '../../src/constants';

export class MockPosData extends MockData {
  constructor() {
    super(PaymentMethodClassification.POS);
    this.posDepositsMock = this.paymentsMock.map(
      (payment: PaymentMock) =>
        new POSDepositMock(
          this.location,
          generateMetadataMock(FileTypes.TDI34),
          payment,
          MatchStatus.PENDING
        )
    );
  }
}

export class MockCashData extends MockData {
  constructor() {
    super(PaymentMethodClassification.CASH);
    const paymentTotals = aggregatedPayments(this.paymentsMock).map(
      (itm) => itm.amount
    );
    this.cashDepositsMock = paymentTotals.flatMap(
      (payment_total: number) =>
        new CashDepositMock(
          this.dateRange,
          this.location,
          payment_total,
          MatchStatus.PENDING
        )
    );
  }
}
