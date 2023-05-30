import { format, addBusinessDays, subBusinessDays } from 'date-fns';

/**
 * @param value
 * @returns
 * @description Verifies that the time input is valid - TDI17 deposit_time occasionally has a 0 as the deposit_time value
 */

const verifyTimeInputIsValid = (value: string): boolean => {
  if (value.split('').length < 4) {
    return false;
  }
  return true;
};

/**
 *
 * @param value
 * @returns
 * @description Sets the time format to HHMMSS in order to be compatible with the database
 */

export const timeFormat = (value: string): string | null => {
  if (verifyTimeInputIsValid(value)) {
    return `${value}00`;
  } else {
    return null;
  }
};

export const parseFlatDateString = (flatDateString: string): string => {
  const year = flatDateString.slice(0, 4);
  const month = flatDateString.slice(4, 6);
  const day = flatDateString.slice(6, 8);
  return `${year}-${month}-${day}`;
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

export const subtractBusinessDaysNoTimezone = (
  date: string,
  days: number
): string => {
  const subDay = subBusinessDays(new Date(date), days);
  const dateWithoutTimezone = new Date(
    subDay.valueOf() + subDay.getTimezoneOffset() * 60 * 1000
  );
  return format(dateWithoutTimezone, 'yyyy-MM-dd');
};

export const addBusinessDaysNoTimezone = (
  date: string,
  days: number
): string => {
  const addDay = addBusinessDays(new Date(date), days);
  const dateWithoutTimezone = new Date(
    addDay.valueOf() + addDay.getTimezoneOffset() * 60 * 1000
  );
  return format(dateWithoutTimezone, 'yyyy-MM-dd');
};
