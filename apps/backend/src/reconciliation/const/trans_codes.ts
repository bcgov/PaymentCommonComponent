export interface TransactionCodeInterface {
  code: number;
  description: string;
  type: string;
}

export const transaction_codes: TransactionCodeInterface[] = [
  { code: 10, description: 'Purchase (P)', type: '+' },
  { code: 11, description: 'Preauth purchase (PA)', type: '+' },
  { code: 12, description: 'Preauth purchase complete (PAC)', type: '+' },
  { code: 14, description: 'Merchandise return (R)', type: '-' },
  { code: 21, description: 'Purchase adjustment', type: '-' },
  { code: 22, description: 'Merchandise Return Adjustment', type: '+' },
  { code: 13, description: 'N/A', type: 'N/A' }
];
