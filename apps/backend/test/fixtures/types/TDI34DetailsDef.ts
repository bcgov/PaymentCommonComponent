export const TDI34DetailsDef = {
  rcd_type: {
    example: 2,
    type: number,
    width: 1,
    required: true
  },
  merchant_no: {
    example: '20777441',
    type: string,
    width: 8,
    required: true
  },
  terminal_no: {
    example: 'GA2077744108',
    type: string,
    width: 12,
    required: true
  },
  fill1: {
    example: '',
    type: string,
    default: '',
    width: 5,
    required: false
  },
  card_vendor: {
    example: 'M ',
    type: string,
    width: 2,
    required: true
  },
  card_id: {
    example: '***************9164',
    type: string,
    width: 19,
    required: true
  },
  transaction_date: {
    example: '2022-11-04',
    type: string,
    width: 8,
    required: true
  },
  transaction_time: {
    example: '09:19',
    type: string,
    width: 4,
    required: true
  },
  settlement_date: {
    example: '2022-11-04',
    type: string,
    width: 8,
    required: true
  },
  transaction_cd: {
    example: '10',
    type: string,
    width: 2,
    required: true
  },
  fill2: {
    example: '',
    type: string,
    default: '',
    width: 3,
    required: false
  },
  approval_cd: {
    example: '08002E',
    type: string,
    width: 6,
    required: true
  },
  fill3: {
    example: '',
    type: string,
    default: '',
    width: 2,
    required: false
  },
  transaction_amt: {
    example: ('000008000' = 80.0),
    type: number,
    width: 9,
    required: true
  },
  invoice_no: {
    example: '0000001985',
    type: string,
    width: 10,
    required: true
  },
  echo_data_field: {
    example: '13V04',
    type: string,
    width: 36,
    default: '',
    required: false
  },
  fill4: {
    example: '',
    type: string,
    default: '',
    width: 36,
    required: false
  }
};
