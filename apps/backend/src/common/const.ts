export enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  MATCH = 'MATCH',
  EXCEPTION = 'EXCEPTION'
}

const transactionCodes = {
  purchase: {
    code: 10,
    refund: false
  },
  preauth_purchase: {
    code: 11,
    refund: false
  },
  preauth_purchase_complete: {
    code: 12,
    refund: false
  },
  merch_return: {
    code: 14,
    refund: true
  },
  purchase_adjustment: {
    code: 21,
    refund: true
  },
  merch_return_adjustment: {
    code: 22,
    refund: false
  }
};
export enum TransactionCode {
  PURCHASE = transactionCodes.purchase.code,
  PREAUTH_PURCHASE = transactionCodes.preauth_purchase.code,
  PREAUTH_PURCHASE_COMPLETE = transactionCodes.preauth_purchase_complete.code,
  MERCH_RETURN = transactionCodes.merch_return.code,
  PURCHASE_ADJUSTMENT = transactionCodes.purchase_adjustment.code,
  MERCH_RETURN_ADJUSTMENT = transactionCodes.merch_return_adjustment.code
}
