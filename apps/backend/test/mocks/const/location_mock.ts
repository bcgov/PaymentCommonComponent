import { faker } from '@faker-js/faker';
import { locations } from './locations';
import { MinistryLocationEntity } from '../../../src/location/entities';

export const generateLocation = (): MinistryLocationEntity => {
  return faker.helpers.arrayElement(locations);
};
