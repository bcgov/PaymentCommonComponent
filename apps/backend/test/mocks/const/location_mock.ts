import { faker } from '@faker-js/faker';
import { LocationEntity } from 'src/location/entities';
import { locations } from './locations';

export const generateLocation = (): LocationEntity => {
  return faker.helpers.arrayElement(locations);
};
