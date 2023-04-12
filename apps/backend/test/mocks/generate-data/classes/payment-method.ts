import { faker } from '@faker-js/faker';
import { paymentMethods } from '../const/payment-methods';
import { PaymentMethod } from '../types/interface';

export const getPaymentMethod = (): PaymentMethod => {
  return faker.helpers.arrayElement(paymentMethods);
};
