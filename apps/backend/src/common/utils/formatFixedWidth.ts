export const timeFormat = (value: string): string => {
  const time = {
    hour: value.slice(0, 2),
    minute: value.slice(2, 4)
  };
  return `${time.hour}:${time.minute}`;
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
