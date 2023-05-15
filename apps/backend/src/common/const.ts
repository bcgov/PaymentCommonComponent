export enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  MATCH = 'MATCH',
  EXCEPTION = 'EXCEPTION',
}

export const MatchStatusAll = [
  MatchStatus.EXCEPTION,
  MatchStatus.MATCH,
  MatchStatus.PENDING,
  MatchStatus.IN_PROGRESS,
];

export enum TransactionCode {
  PURCHASE = 10,
  PREAUTH_PURCHASE = 11,
  PREAUTH_PURCHASE_COMPLETE = 12,
  MERCH_RETURN = 14,
  PURCHASE_ADJUSTMENT = 21,
  MERCH_RETURN_ADJUSTMENT = 22,
}

export enum Dates {
  FISCAL_YEAR_START_DATE = '2023-01-01',
}
