import { PaymentEntity } from '../transaction/entities';

export const checkPaymentsForFullMatch = (payments: PaymentEntity[]) => {
  return payments.every((payment) => payment.match === true);
};

export const checkPaymentsForPartialMatch = (payments: PaymentEntity[]) => {
  return payments.some((payment) => payment.match === true);
};

export const checkPaymentsForZeroMatch = (payments: PaymentEntity[]) => {
  return payments.every((payment) => payment.match === false);
};
