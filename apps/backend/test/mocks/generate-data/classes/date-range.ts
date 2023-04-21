import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { DateRange } from './../../../../dist/src/constants.d';

export const getDateRange = (): DateRange => {
  const to_date = format(faker.date.recent(10), 'yyyy-MM-dd');
  const from_date = format(faker.date.recent(5, to_date), 'yyyy-MM-dd');

  return {
    to_date,
    from_date
  };
};
