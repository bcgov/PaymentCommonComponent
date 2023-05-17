import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { DateRange } from '../../../src/constants';

export interface DateRanges extends DateRange {
  pastDueDate: string;
}
export const generateDateRange = (): DateRanges => {
  const maxDate = format(faker.date.recent(10), 'yyyy-MM-dd');
  const minDate = format(faker.date.recent(5, maxDate), 'yyyy-MM-dd');

  return {
    pastDueDate: format(faker.date.recent(5, minDate), 'yyyy-MM-dd'),
    minDate,
    maxDate,
  };
};
