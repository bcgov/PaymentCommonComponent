export const TDI17DetailsDef = {
  rcd_type: {
    example: 2,
    width: 1,
    required: true,
    type: number
  },
  ministry_no: {
    example: 'FI',
    width: 2,
    required: true,
    type: string
  },
  program_cd: {
    example: '0070',
    width: 4,
    required: true,
    type: string
  },
  deposit_date: {
    example: '2022-08-05',
    width: 8,
    required: true,
    type: string
  },
  transaction_type: {
    example: '200',
    width: 3,
    required: true,
    type: string
  },
  office_number: {
    example: '02',
    width: 2,
    required: true,
    type: string
  },
  deposit_time: {
    example: '15:09',
    width: 4,
    required: false,
    default: '',
    type: string
  },

  seq_no: {
    example: '001',
    width: 3,
    required: false,
    default: '',
    type: string
  },

  location_desc: {
    example: 'SERVICE BC BURNS LAKE',
    width: 40,
    required: true,
    type: string
  },

  deposit_amt_curr: {
    example: ('000000381046' = 3810.46),
    width: 12,
    required: true,
    type: number
  },
  currency: {
    example: 'US',
    width: 2,
    required: false,
    default: '',
    type: string
  },
  exchange_adj_amt: {
    example: 0.0,
    width: 12,
    required: false,
    default: 0.0,
    type: number
  },
  deposit_amt_cdn: {
    example: 3810.46,
    width: 12,
    required: true,
    type: float
  },

  destination_bank_no: {
    example: '0002',
    width: 4,
    required: true,
    type: string
  },

  batch_no: {
    example: '002300949',
    width: 9,
    required: false,
    default: '',
    type: string
  },

  jv_type: {
    example: 'I',
    width: 1,
    required: false,
    default: '',
    type: string
  },

  jv_no: {
    example: '002324733',
    width: 9,
    required: false,
    default: '',
    type: string
  }
};
