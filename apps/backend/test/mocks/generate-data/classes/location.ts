import { faker } from '@faker-js/faker';
import { locations } from '../const/locations';
import { Location } from '../types/interface';

export const getLocation = (): Location => {
  return faker.helpers.arrayElement(locations);
};
