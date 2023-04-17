import { faker } from '@faker-js/faker';
import { paymentMethods } from '../const/payment-methods';
import { PaymentMethodEntity } from '../../../../src/transaction/entities';

export const getPaymentMethod = (): PaymentMethodEntity => {
  return faker.helpers.arrayElement(paymentMethods);
};
