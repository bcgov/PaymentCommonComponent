export enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  MATCH = 'MATCH',
  EXCEPTION = 'EXCEPTION'
}

export enum TransactionCode {
  PURCHASE = 10,
  PREAUTH_PURCHASE = 11,
  PREAUTH_PURCHASE_COMPLETE = 12,
  MERCH_RETURN = 14,
  PURCHASE_ADJUSTMENT = 21,
  MERCH_RETURN_ADJUSTMENT = 22
}
