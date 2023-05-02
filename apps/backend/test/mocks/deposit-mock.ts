import { getLocation } from './const/location_mock';
import { getPaymentMethod } from './const/payment-method_mock';
import { generateData } from './generateData';
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

const data = generateData(locationMock, Ministries.SBC);

export const paymentsMock = data.flatMap((itm) => itm.payments);
export const transactionMock = data.flatMap((itm) => itm.transactions[0]);
export const transactionsMock = data.flatMap((itm) => itm.transactions);
export const cashDepositMock = data.flatMap((itm) => itm.cashDeposits[0]);
export const cashDepositsMock = data.flatMap((itm) => itm.cashDeposits);
export const posDepositMock = data.flatMap((itm) => itm.posDeposits[0]);
export const posDepositsMock = data.flatMap((itm) => itm.posDeposits);
export const dateRangeMock = data.flatMap((itm) => itm.dateRange);
