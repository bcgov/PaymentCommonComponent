import { getDateRange } from './const/date_range_mock';
import { getLocation } from './const/location_mock';
import { getPaymentMethod } from './const/payment-method_mock';
import { MockData } from './generateData';
import { FileMetadata } from '../../src/common/columns/index';
import { MatchStatus } from '../../src/common/const';
import { Ministries, PaymentMethodClassification } from '../../src/constants';
import { PaymentEntity } from '../../src/transaction/entities/payment.entity';

export const locationMock = getLocation();
export const paymentMethodMock = getPaymentMethod();

export const metadataMock: FileMetadata = {
  source_file_name: 'TDI34',
  date_uploaded: new Date('2020-01-01'),
  source_file_length: 0,
  source_file_line: 0,
  program: Ministries.SBC
};

const data = new MockData();

const baseData = {
  dateRange: getDateRange(),
  program: Ministries.SBC,
  location: getLocation()
};
export const posTransactionsMock = data.generateTransactions(
  baseData,
  PaymentMethodClassification.POS,
  MatchStatus.PENDING
);
export const posPayments = posTransactionsMock.flatMap((itm) =>
  itm.payments.map((payment) => ({
    ...payment,
    timestamp: itm.transaction_date,
    transaction: {
      ...itm
    }
  }))
);
export const posDeposits = data.generatePOSDeposits(
  baseData,
  metadataMock,
  posTransactionsMock,
  MatchStatus.PENDING
);
export const cashTransactionsMock = data.generateTransactions(
  baseData,
  PaymentMethodClassification.CASH,
  MatchStatus.PENDING
);
export const cashPayments = cashTransactionsMock.flatMap((itm) =>
  itm.payments.map((payment) => ({
    ...payment,
    timestamp: itm.fiscal_close_date,
    transaction: {
      ...itm
    }
  }))
) as unknown;
export const cashDeposits = data.generateCashDeposits(
  baseData,
  cashPayments as PaymentEntity[],
  MatchStatus.PENDING
);
