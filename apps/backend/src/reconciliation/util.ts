import { MatchStatus } from '../common/const';
import { PaymentEntity } from '../transaction/entities';

export const checkPaymentsForFullMatch = (payments: PaymentEntity[]) => {
  return payments.every((payment) => payment.status === MatchStatus.MATCH);
};

export const checkPaymentsForPartialMatch = (payments: PaymentEntity[]) => {
  return payments.some((payment) => payment.status === MatchStatus.MATCH);
};

export const checkPaymentsForZeroMatch = (payments: PaymentEntity[]) => {
  return payments.every((payment) => payment.status !== MatchStatus.MATCH);
};
