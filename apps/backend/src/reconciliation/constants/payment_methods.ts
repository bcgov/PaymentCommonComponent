export interface PaymentMethod {
  method: string;
  sbc_garms: number;
  transaction_type: string | number;
  card_vendor: string;
}

export const payment_methods: PaymentMethod[] = [
  { sbc_garms: 10, method: 'ICBC_PAR', transaction_type: '', card_vendor: '' },
  {
    sbc_garms: 16,
    method: 'ICBC_WRITE_OFF',
    transaction_type: '',
    card_vendor: ''
  },
  {
    sbc_garms: 20,
    method: 'RTO_INTERAC_DEBIT',
    transaction_type: '',
    card_vendor: ''
  },
  { sbc_garms: 3, method: 'ACCOUNT', transaction_type: '', card_vendor: '' },
  { sbc_garms: 5, method: 'MVB_AR', transaction_type: '', card_vendor: '' },
  { sbc_garms: 6, method: 'MVB_HOLD', transaction_type: '', card_vendor: '' },
  { sbc_garms: 9, method: 'US_FUNDS', transaction_type: '', card_vendor: '' },
  { sbc_garms: 14, method: 'CHQ_MAIL', transaction_type: '', card_vendor: '' },
  { sbc_garms: 15, method: 'CHQ_DROP', transaction_type: '', card_vendor: '' },
  {
    sbc_garms: 2,
    method: 'CHEQUE',
    transaction_type: 201,
    card_vendor: ''
  },
  {
    sbc_garms: 12,
    method: 'MASTERCARD',
    transaction_type: '',
    card_vendor: 'MC'
  },
  { sbc_garms: 13, method: 'VISA', transaction_type: '', card_vendor: 'V' },
  { sbc_garms: 17, method: 'AMEX', transaction_type: '', card_vendor: 'AX' },
  {
    sbc_garms: 18,
    method: 'VISA_DEBIT',
    transaction_type: '',
    card_vendor: 'PV'
  },
  {
    sbc_garms: 19,
    method: 'MC_Debit',
    transaction_type: '',
    card_vendor: 'MV'
  },
  { sbc_garms: 1, method: 'CASH', transaction_type: 200, card_vendor: '' },
  {
    sbc_garms: 11,
    method: 'DEBIT_CARD',
    transaction_type: '',
    card_vendor: 'P'
  }
];
