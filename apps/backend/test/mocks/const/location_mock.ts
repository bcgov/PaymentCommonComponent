import { faker } from '@faker-js/faker';
import { normalizedLocations } from './locations';
import { NormalizedLocation } from '../../../src/constants';

export const generateLocation = (): NormalizedLocation => {
  return faker.helpers.arrayElement(normalizedLocations);
};
