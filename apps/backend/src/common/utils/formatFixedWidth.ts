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

export const timeFormat = (value: string): string => {
  const time = {
    hour: value.slice(0, 2),
    minute: value.slice(2, 4),
    second: value.slice(4, 6)
  };
  return `${time.hour}:${time.minute}:${time.second}`;
};

export const dateFormat = (value: string): string => {
  const date = {
    year: value.slice(0, 4),
    month: value.slice(4, 6),
    day: value.slice(6, 8)
  };
  return `${date.year}-${date.month}-${date.day}`;
};

export const decimalFormat = (value: string): string => {
  const stringLength = value.split('').length;
  const decimalPlace = stringLength - 2;
  return (
    parseInt(value.slice(0, decimalPlace)) +
    '.' +
    value.slice(decimalPlace, stringLength)
  );
};
