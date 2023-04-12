import { faker } from '@faker-js/faker';

export interface DateRange {
  to_date: Date;
  from_date: Date;
}

export const getDateRange = (): DateRange => {
  const to_date = faker.date.recent(10);
  const from_date = faker.date.recent(5, to_date);

  return {
    to_date,
    from_date
  };
};
