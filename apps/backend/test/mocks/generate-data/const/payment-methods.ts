import { PaymentMethod } from '../types/interface';
export const paymentMethods: PaymentMethod[] = [
  {
    method: 'AX',
    description: 'AMEX',
    sbc_code: 17
  },
  {
    method: 'P',
    description: 'DEBIT',
    sbc_code: 11
  },
  {
    method: 'V',
    description: 'VISA',
    sbc_code: 13
  },
  {
    method: 'M',
    description: 'MASTERCARD',
    sbc_code: 12
  },
  {
    method: 'PV',
    description: 'DEBIT_VISA',
    sbc_code: 18
  },
  {
    method: 'MV',
    description: 'DEBIT_MASTERCARD',
    sbc_code: 19
  },
  {
    method: 'CASH',
    description: 'CASH',
    sbc_code: 1
  },
  {
    method: 'CHQ',
    description: 'CHEQUE',
    sbc_code: 2
  },
  {
    method: 'ACCOUNT',
    description: 'ACCOUNT',
    sbc_code: 3
  },
  {
    method: 'MVB_AR',
    description: 'MVB_AR',
    sbc_code: 5
  },
  {
    method: 'MVB_HOLD',
    description: 'MVB_HOLD',
    sbc_code: 6
  },
  {
    method: 'US_FUNDS',
    description: 'US_FUNDS',
    sbc_code: 9
  },
  {
    method: 'CHQ_MAIL',
    description: 'CHQ_MAIL',
    sbc_code: 14
  },
  {
    method: 'CHQ_DROP',
    description: 'CHQ_DROP',
    sbc_code: 15
  },
  {
    method: 'RTO',
    description: 'RTO_INTERACT',
    sbc_code: 20
  },
  {
    method: 'ICBC_WO',
    description: 'ICBC_WRITE_OFF',
    sbc_code: 16
  },
  {
    method: 'ICBC_PAY',
    description: 'ICBC_PAYTYPE_10_FOR_PAR',
    sbc_code: 10
  },
  {
    method: 'NC_CHQ',
    description: 'NON-CERTIFIED CHEQUE',
    sbc_code: 0
  },
  {
    method: 'CERT_CHQ',
    description: 'CERTIFIED CHEQUE',
    sbc_code: 0
  },
  {
    method: 'MO',
    description: 'MONEY ORDER',
    sbc_code: 0
  },
  {
    method: 'BANK_DRAFT',
    description: 'BANK DRAFT',
    sbc_code: 0
  },
  {
    method: 'ICEPAY',
    description: 'ICEPAY',
    sbc_code: 0
  },
  {
    method: 'BC_EXP_PAY',
    description: 'BC EXPRESSPAY',
    sbc_code: 0
  },
  {
    method: 'SURETY',
    description: 'SURETY',
    sbc_code: 0
  },
  {
    method: 'ILOC',
    description: 'ILOC',
    sbc_code: 0
  },
  {
    method: 'WIRE',
    description: 'WIRE TRANSFER',
    sbc_code: 0
  },
  {
    method: 'DIRECT_DEP',
    description: 'DIRECT DEPOSIT',
    sbc_code: 0
  },
  {
    method: 'JV',
    description: 'JOURNAL VOUCHER',
    sbc_code: 0
  },
  {
    method: 'FEE_WAIVER',
    description: 'FEE WAIVER',
    sbc_code: 0
  },
  {
    method: 'EFT',
    description: 'EFT',
    sbc_code: 0
  },
  {
    method: 'POS',
    description: 'POS',
    sbc_code: 0
  }
];
