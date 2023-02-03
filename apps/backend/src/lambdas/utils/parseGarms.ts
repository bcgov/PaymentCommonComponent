import {
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity
} from '../../transaction/entities';
import { IGarmsJson, IGarmsPayment } from '../../transaction/interface';
import { Ministries } from '../../constants';
// For parsing GARMS Sales JSON into PCC Sales

// TODO: HIGH PRIO
// 1. Make sure IDs are unique

export const parseGarms = async (
  garmsJson: IGarmsJson[],
  source_file_name: string,
  paymentMethods: PaymentMethodEntity[]
): Promise<TransactionEntity[]> => {
  return garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      fiscal_close_date,
      payment_total,
      payments,
      source
    }: IGarmsJson) =>
      new TransactionEntity({
        source_id: Ministries.SBC,
        id: sales_transaction_id,
        transaction_date: sales_transaction_date
          .split('')
          .splice(0, 10)
          .join(''),
        transaction_time: sales_transaction_date
          .split('')
          .splice(11, 10)
          .join(''),
        location_id: parseInt(source.location_id),
        amount: payment_total,
        fiscal_close_date,
        payments: payments.map(
          ({ method, amount, exchange_rate, currency }: IGarmsPayment) => {
            return new PaymentEntity({
              method: paymentMethods.find((pm) => {
                return pm.sbc_code === method;
              })?.method,
              amount: parseFloat(amount.toFixed(2)),
              exchange_rate,
              currency
            });
          }
        ),
        // TODO: Populate by mapping garms json to txn interface
        transactionJson: {},
        migrated: true,
        source_file_name
      })
  );
};
