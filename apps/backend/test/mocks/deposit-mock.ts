import { BaseData } from 'test/reconciliation/generate-data/classes/base-data';
import { getDateRange } from 'test/reconciliation/generate-data/classes/date-range';
import { getLocation } from '../reconciliation/generate-data/classes/location';
import { getPaymentMethod } from '../reconciliation/generate-data/classes/payment-method';
import { GenerateData } from '../reconciliation/generate-data/generateData';

import { FileMetadata } from '../../src/common/columns/index';

import { Ministries } from '../../src/constants';

export const locationMock = getLocation();
export const paymentMethodMock = getPaymentMethod();
export const metadataMock: FileMetadata = {
  source_file_name: 'TDI34',
  date_uploaded: new Date('2020-01-01'),
  source_file_length: 0,
  source_file_line: 0,
  program: 'TDI34'
};

export const mockReconciliationEvent = {
  location: locationMock,
  ministry: Ministries.SBC,
  dateRange: getDateRange()
};

const data = new GenerateData();
const baseData = new BaseData(
  mockReconciliationEvent.dateRange,
  mockReconciliationEvent.location,
  mockReconciliationEvent.ministry
);
export const paymentsMock = data.generatePayments();
export const transactionMock = data.generateTransaction(baseData, paymentsMock);
export const cashDepositMock = {
  ...data.generateCashDeposit(baseData, 5),
  ...metadataMock
};
export const posDepositMock = data.generatePOSDeposit(
  baseData,
  paymentsMock[0],
  transactionMock
);
