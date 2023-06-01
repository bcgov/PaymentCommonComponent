import { faker } from '@faker-js/faker';
import { NormalizedLocation } from 'src/constants';
import { normalizedLocations } from './locations';

export const generateLocation = (): NormalizedLocation => {
  return faker.helpers.arrayElement(normalizedLocations);
};
