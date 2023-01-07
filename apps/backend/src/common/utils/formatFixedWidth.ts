export const transactionType = (value: string) => {
  switch (value) {
    case '200':
      return { code: 200, description: 'Cash' };
    case '201':
      return { code: 201, description: 'Service BC' };
    case '202':
      return { code: 202, description: 'Debit' };
    case '203':
      return { code: 203, description: 'Mastercard POS' };
    case '204':
      return { code: 204, description: 'Mastercard' };
    case '205':
      return { code: 205, description: 'Mastercard POS' };
    case '206':
      return { code: 206, description: 'Visa' };
    default:
      return { code: value, description: 'N/A' };
  }
};

export const cardVendor = (type: string) => {
  switch (type) {
    case 'M':
      return { type: type, vendor: 'MasterCard' };
    case 'V':
      return { type: type, vendor: 'VISA' };
    case 'AX':
      return { type: type, vendor: 'Amex' };
    case 'PV':
      return { type: type, vendor: 'VISA Debit' };
    case 'MD':
      return { type: type, vendor: 'Debit MasterCard' };
    default:
      return { type: type, vendor: 'N/A' };
  }
};

export const transactionCode = (code: string) => {
  switch (code) {
    case '10':
      return { code, description: 'Purchase (P)', type: '+' };
    case '11':
      return { code, description: 'Preauth purchase (PA)', type: '+' };
    case '12':
      return {
        code,
        description: 'Preauth purchase complete (PAC)',
        type: '+'
      };
    case '14':
      return { code, description: 'Merchandise return (R)', type: '-' };
    case '21':
      return { code, description: 'Purchase adjustment', type: '-' };
    case '22':
      return { code, description: 'Merchandise Return Adjustment', type: '+' };
    default:
      return { code, description: 'N/A', type: 'N/A' };
  }
};

export const timeFormat = (value: string[]) =>
  `${value[0]}${value[1]}:${value[2]}${value[3]}`;

export const dateFormat = (value: string[]) =>
  `${[value[0], value[1], value[2], value[3]].join('')}-${[
    value[4],
    value[5]
  ].join('')}-${[value[6], value[7]].join('')}`;
