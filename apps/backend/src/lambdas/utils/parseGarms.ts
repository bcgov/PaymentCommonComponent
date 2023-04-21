import { parseFlatDateString } from '../../common/utils/format';
import { Ministries } from '../../constants';
import { TransactionEntity, PaymentEntity } from '../../transaction/entities';
import { PaymentMethodEntity } from '../../transaction/entities/payment-method.entity';
import {
  SBCGarmsDistribution,
  SBCGarmsJson,
  SBCGarmsPayment
} from '../../transaction/interface';
import {
  AccountingItem,
  Distribution,
  Transaction
} from '../../transaction/interface/transaction.interface';

/**
 * @description For parsing GARMS Sales JSON into PCC Sales Transactions
 * @param garmsJson
 * @param source_file_name
 * @param paymentMethods
 * @returns
 */

export const parseGarms = async (
  garmsJson: SBCGarmsJson[],
  source_file_name: string,
  paymentMethods: PaymentMethodEntity[]
): Promise<TransactionEntity[]> => {
  const garmsData = garmsJson.map((itm) => ({
    ...itm,
    payments: itm.payments.filter((payment) => payment.amount !== 0)
  }));
  const parsedGarms = garmsData.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      fiscal_close_date,
      void_indicator,
      payment_total,
      payments,
      source,
      misc,
      distributions
    }): TransactionEntity =>
      new TransactionEntity({
        source_id: Ministries.SBC,
        transaction_id: sales_transaction_id,
        transaction_date: sales_transaction_date.slice(0, 10),
        transaction_time: sales_transaction_date
          .slice(11, 19)
          .replaceAll('.', ':'),
        location_id: parseInt(source.location_id),
        total_transaction_amount: payment_total,
        fiscal_close_date: parseFlatDateString(fiscal_close_date),
        payments: payments.map((garmsPayment: SBCGarmsPayment) =>
          parseSBCGarmsPayments(garmsPayment, paymentMethods)
        ),
        void_indicator: void_indicator !== ' ' ? true : false,
        migrated: true,
        source_file_name,
        transactionJson: new Transaction({
          transaction_id: sales_transaction_id,
          transaction_date: sales_transaction_date.slice(0, 10),
          transaction_time: sales_transaction_date
            .slice(11, 19)
            .replaceAll('.', ':'),
          fiscal_close_date: parseFlatDateString(fiscal_close_date),
          payment_total: payment_total,
          payments: payments.map((garmsPayment: SBCGarmsPayment) =>
            parseSBCGarmsPayments(garmsPayment, paymentMethods)
          ),
          void_indicator: void_indicator !== ' ' ? true : false,
          misc: {
            ...misc
          },
          source: {
            location_id: source?.location_id,
            source_id: source?.source_id,
            accepted_payment_methods: source?.accepted_payment_methods ?? []
          },
          accounting: Object.values(distributions)?.[0].map(
            (itm: SBCGarmsDistribution) =>
              ({
                sequence: itm.line_number,
                details: {
                  description: itm.line_description,
                  code: itm.dist_client_code
                },
                distributions: Object.values(distributions)?.[0].map(
                  (itm) => new Distribution(itm)
                )
              } as AccountingItem)
          )
        })
      })
  );
  return parsedGarms;
};

const parseSBCGarmsPayments = (
  garmsPayment: SBCGarmsPayment,
  paymentMethods: PaymentMethodEntity[]
): PaymentEntity =>
  new PaymentEntity({
    payment_method: paymentMethods.find(
      (pm: PaymentMethodEntity) =>
        pm.sbc_code === parseInt(garmsPayment.method) && pm
    ),
    currency: garmsPayment.currency || 'CAD',
    exchange_rate: garmsPayment.exchange_rate,
    foreign_currency_amount:
      garmsPayment.currency !== 'CAD' ? garmsPayment.amount : undefined,
    amount:
      garmsPayment.currency !== 'CAD' && garmsPayment.exchange_rate
        ? parseFloat(
            (garmsPayment.amount * (garmsPayment.exchange_rate / 100)).toFixed(
              2
            )
          )
        : parseFloat(garmsPayment.amount?.toFixed(2))
  });
