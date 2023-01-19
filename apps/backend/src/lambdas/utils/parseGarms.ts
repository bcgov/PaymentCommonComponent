import { ITransaction, IGarmsJson } from '../../reconciliation/interface';

export const parseGarms = (garmsJson: IGarmsJson[]): ITransaction[] => {
  return garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      payment_total,
      payments,
      source
    }: IGarmsJson) => ({
      transaction_id: sales_transaction_id,
      transaction_date: sales_transaction_date.split('').splice(0, 10).join(''),
      transaction_time: sales_transaction_date
        .split('')
        .splice(11, 10)
        .join(''),
      location_id: parseInt(source.location_id),
      location: parseInt(source.location_id),
      payment_total,
      payments: payments.map(({ method, amount, exchange_rate, currency }) => ({
        method: parseInt(method),
        amount,
        exchange_rate,
        currency
      }))
    })
  );
};
