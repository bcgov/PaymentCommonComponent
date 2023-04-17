import { parse } from 'date-fns';
import { parseFlatDateString } from '../../common/utils/format';
import { Ministries } from '../../constants';
import { TransactionEntity, PaymentEntity } from '../../transaction/entities';
import { PaymentMethodEntity } from '../../transaction/entities/payment-method.entity';
import { SBCGarmsJson, SBCGarmsPayment } from '../../transaction/interface';
import { Transaction } from '../../transaction/interface/transaction.interface';

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
      distributions,
      revAccounts
    }): TransactionEntity =>
      new TransactionEntity({
        source_id: Ministries.SBC,
        transaction_id: sales_transaction_id,
        transaction_date: parse(
          sales_transaction_date.slice(0, 10),
          'yyyy-MM-dd',
          new Date()
        ),
        transaction_time: sales_transaction_date
          .slice(11, 19)
          .replaceAll('.', ':'),
        location_id: parseInt(source.location_id),
        total_transaction_amount: payment_total,
        fiscal_close_date: parseFlatDateString(fiscal_close_date),
        payments: parseSBCGarmsPayments(payments, paymentMethods),
        void_indicator: void_indicator !== ' ' ? true : false,
        migrated: true,
        source_file_name,
        transactionJson: new Transaction({
          sales_transaction_id,
          void_indicator,
          sales_transaction_date: sales_transaction_date.slice(0, 10),
          fiscal_close_date: fiscal_close_date,
          payment_total,
          payments,
          source,
          misc,
          distributions,
          revAccounts
        })
      })
  );
  return parsedGarms;
};

const parseSBCGarmsPayments = (
  garmsPayments: SBCGarmsPayment[],
  paymentMethods: PaymentMethodEntity[]
): PaymentEntity[] => {
  const parsedPayments = garmsPayments.map(
    (garmsPayment) =>
      new PaymentEntity({
        payment_method: paymentMethods.find((pm) => {
          return pm.sbc_code === garmsPayment.method;
        }),
        currency: garmsPayment.currency || 'CAD',
        exchange_rate: garmsPayment.exchange_rate,
        foreign_currency_amount:
          garmsPayment.currency !== 'CAD' ? garmsPayment.amount : undefined,
        amount:
          garmsPayment.currency !== 'CAD' && garmsPayment.exchange_rate
            ? parseFloat(
                (
                  garmsPayment.amount *
                  (garmsPayment.exchange_rate / 100)
                ).toFixed(2)
              )
            : parseFloat(garmsPayment.amount?.toFixed(2))
      })
  );
  return parsedPayments;
};
