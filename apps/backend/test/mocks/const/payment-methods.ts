import { PaymentMethodClassification } from './../../../src/constants';
import { PaymentMethodEntity } from './../../../src/transaction/entities/payment-method.entity';

export const paymentMethods: PaymentMethodEntity[] = [
  {
    method: 'AX',
    description: 'AMEX',
    sbc_code: 17,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'P',
    description: 'DEBIT',
    sbc_code: 11,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'V',
    description: 'VISA',
    sbc_code: 13,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'M',
    description: 'MASTERCARD',
    sbc_code: 12,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'PV',
    description: 'DEBIT_VISA',
    sbc_code: 18,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'MV',
    description: 'DEBIT_MASTERCARD',
    sbc_code: 19,
    classification: PaymentMethodClassification.POS,
  },
  {
    method: 'CASH',
    description: 'CASH',
    sbc_code: 1,
    classification: PaymentMethodClassification.CASH,
  },
  {
    method: 'CHQ',
    description: 'CHEQUE',
    sbc_code: 2,
    classification: PaymentMethodClassification.CASH,
  },
];
