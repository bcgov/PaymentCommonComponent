export const DDFDetailsDef = {
  rcd_type: {
    example: 2,
    type: number,
    chars: 1,
    required: true
  },
  merchant_no: {
    example: '22046144',
    type: string,
    chars: 8,
    required: true
  },
  terminal_id: {
    example: 'Y22046144001',
    type: string,
    chars: 12,
    required: true
  },
  filler1: {
    example: '',
    type: string,
    chars: 5,
    required: false,
    default: ''
  },
  card_vendor: {
    example: 'V ',
    type: string,
    chars: 2,
    required: true
  },
  card_id: {
    example: 'XXXXXXXXXXXXXXX1111',
    type: string,
    char: 19,
    required: true
  },
  transaction_date: {
    example: '2022-03-30',
    type: string,
    chars: 8,
    required: true
  },
  transaction_time: {
    example: '08:10',
    type: string,
    chars: 4,
    required: true
  },
  settlement_date: {
    example: '2022-03-30',
    type: string,
    chars: 8,
    required: false,
    default: ''
  },
  transaction_code: {
    example: '10',
    type: string,
    chars: 2,
    required: true,
    default: ''
  },
  filler2: {
    example: '',
    type: string,
    chars: 3,
    required: false,
    default: ''
  },
  approval_code: {
    example: 'TEST ',
    type: string,
    chars: 6,
    required: false,
    default: ''
  },
  filler3: {
    example: '',
    type: string,
    chars: 2,
    required: false,
    default: ''
  },
  transaction_amount: {
    example: ('0000001000' = 10.0),
    type: number,
    chars: 9,
    required: true
  },
  unknown: {
    example: '',
    type: string,
    chars: 10,
    required: false,
    default: ''
  },
  merchant_work_area: {
    example: '100329420007511333117589202',
    chars: 36,
    type: string,
    required: false
  },
  filler4: {
    example: '',
    type: string,
    chars: 36,
    required: false,
    default: ''
  }
};
