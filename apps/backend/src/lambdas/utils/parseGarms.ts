import { IGarmsJson } from '../../reconciliation/interface';
import { TransactionEntity } from '../../reconciliation/entities/transaction.entity';

//TODO remove this once sales api is ready - development only
export const parseGarms = async (
  garmsJson: IGarmsJson[]
): Promise<TransactionEntity[] | boolean | void> => {
  return garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
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
        payments: payments.map(
          ({ method, amount, exchange_rate, currency }) => ({
            method: parseInt(method),
            amount,
            exchange_rate,
            currency
          })
        )
      })
  );
};
