import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { DateRange } from '../../../src/constants';

export interface DateRanges extends DateRange {
  pastDueDate: string;
}
export const generateDateRange = (): DateRanges => {
  const to_date = format(faker.date.recent(10), 'yyyy-MM-dd');
  const from_date = format(faker.date.recent(5, to_date), 'yyyy-MM-dd');

  return {
    pastDueDate: format(faker.date.recent(5, from_date), 'yyyy-MM-dd'),
    to_date,
    from_date,
  };
};
