import Decimal from 'decimal.js';
import { parseFlatDateString } from '../../common/utils/format';
import { LocationEntity } from '../../location/entities';
import { TransactionEntity, PaymentEntity } from '../../transaction/entities';
import { PaymentMethodEntity } from '../../transaction/entities/payment-method.entity';
import {
  SBCGarmsDistribution,
  SBCGarmsJson,
  SBCGarmsPayment,
} from '../../transaction/interface';
import {
  AccountingItem,
  Distribution,
  Transaction,
} from '../../transaction/interface/transaction.interface';

/**
 * @description For parsing GARMS Sales JSON into PCC Sales Transactions
 * @param garmsJson
 * @param source_file_name
 * @param paymentMethods
 * @returns
 */

export const parseGarms = (
  garmsJson: SBCGarmsJson[],
  source_file_name: string,
  paymentMethods: PaymentMethodEntity[],
  fileDate: string,
  locations: LocationEntity[]
): TransactionEntity[] => {
  const garmsData = garmsJson.map((itm) => ({
    ...itm,
    payments: itm.payments.filter((payment) => payment.amount !== 0),
  }));

  return garmsData.map((data: SBCGarmsJson) =>
    parseGarmsData(data, fileDate, source_file_name, paymentMethods, locations)
  );
};

const parseGarmsData = (
  garmsData: SBCGarmsJson,
  fileDate: string,
  source_file_name: string,
  paymentMethods: PaymentMethodEntity[],
  locations: LocationEntity[]
): TransactionEntity => {
  const {
    sales_transaction_date,
    sales_transaction_id,
    fiscal_close_date,
    payment_total,
    payments,
    void_indicator,
    source,
  } = garmsData;

  return new TransactionEntity({
    parsed_on: fileDate,
    location: locations.find(
      (itm) =>
        itm.source_id === source.source_id &&
        itm.location_id === parseInt(source.location_id)
    ),
    transaction_id: sales_transaction_id,
    transaction_date: sales_transaction_date.slice(0, 10),
    transaction_time: sales_transaction_date.slice(11, 19).replaceAll('.', ':'),
    total_transaction_amount: payment_total,
    fiscal_close_date: parseFlatDateString(fiscal_close_date),
    payments: payments.map((garmsPayment: SBCGarmsPayment) =>
      parseSBCGarmsPayments(garmsPayment, paymentMethods)
    ),
    void_indicator: void_indicator === ' ',
    migrated: true,
    source_file_name,
    transactionJson: parseTransactionJson(garmsData, paymentMethods),
  });
};

const parseTransactionJson = (
  garmsData: SBCGarmsJson,
  paymentMethods: PaymentMethodEntity[]
) => {
  const {
    sales_transaction_date,
    sales_transaction_id,
    fiscal_close_date,
    payment_total,
    payments,
    void_indicator,
    misc,
    source,
    distributions,
  } = garmsData;
  return new Transaction({
    transaction_id: sales_transaction_id,
    transaction_date: sales_transaction_date?.slice(0, 10),
    transaction_time: sales_transaction_date
      ?.slice(11, 19)
      .replaceAll('.', ':'),
    fiscal_close_date: parseFlatDateString(fiscal_close_date),
    payment_total: payment_total,
    payments: payments?.map((garmsPayment: SBCGarmsPayment) =>
      parseSBCGarmsPayments(garmsPayment, paymentMethods)
    ),
    void_indicator: void_indicator === ' ',
    misc: {
      ...misc,
    },
    source: {
      location_id: source?.location_id,
      source_id: source?.source_id,
      accepted_payment_methods: source?.accepted_payment_methods ?? [],
    },
    accounting: Object.values(distributions)?.[0].map(
      (itm: SBCGarmsDistribution) =>
        ({
          sequence: itm.line_number,
          details: {
            description: itm.line_description,
            code: itm.dist_client_code,
          },
          distributions: Object.values(distributions)?.[0].map(
            (itm: SBCGarmsDistribution) => new Distribution(itm)
          ),
        }) as AccountingItem
    ),
  });
};

const parseSBCGarmsPayments = (
  garmsPayment: SBCGarmsPayment,
  paymentMethods: PaymentMethodEntity[]
): PaymentEntity => {
  return new PaymentEntity({
    payment_method: paymentMethods.find(
      (pm: PaymentMethodEntity) =>
        pm.sbc_code === parseInt(garmsPayment.method) && pm
    ),
    currency: garmsPayment.currency ?? 'CAD',
    exchange_rate: garmsPayment.exchange_rate,
    foreign_currency_amount:
      garmsPayment.currency !== 'CAD' ? garmsPayment.amount : undefined,
    amount:
      garmsPayment.currency !== 'CAD' && garmsPayment.exchange_rate
        ? new Decimal(garmsPayment.amount)
            .times(garmsPayment.exchange_rate / 100)
            .toDecimalPlaces(2)
            .toNumber()
        : garmsPayment.amount,
  });
};
