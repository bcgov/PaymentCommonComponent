import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { DateRange } from '../../../src/constants';

export interface DateRanges extends DateRange {
  pastDueDate: string;
}
export const generateDateRange = (): DateRanges => {
  const maxDate = format(new Date('2023-05-26'), 'yyyy-MM-dd');
  const minDate = format(new Date('2023-05-22'), 'yyyy-MM-dd');

  return {
    pastDueDate: format(new Date('2023-05-22'), 'yyyy-MM-dd'),
    minDate,
    maxDate,
  };
};
