import { TransactionEntity, PaymentEntity } from '../../sales/entities';
import { IGarmsJson, IGarmsPayment } from '../../sales/interface';

// For parsing GARMS Sales JSON into PCC Sales
export const parseGarms = (garmsJson: IGarmsJson[]): TransactionEntity[] => {
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
        transaction_id: sales_transaction_id,
        transaction_date: sales_transaction_date
          .split('')
          .splice(0, 10)
          .join(''),
        transaction_time: sales_transaction_date
          .split('')
          .splice(11, 10)
          .join(''),
        location_id: parseInt(source.location_id),
        payment_total,
        fiscal_date: fiscal_close_date,
        payments: payments.map(
          ({ method, amount, exchange_rate, currency }: IGarmsPayment) =>
            new PaymentEntity({
              method: parseInt(method),
              amount: amount.toFixed(2),
              exchange_rate,
              currency
            })
        )
      })
  );
};
