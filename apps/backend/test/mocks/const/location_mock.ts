import { faker } from '@faker-js/faker';
import { locations } from './locations';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';

export const generateLocation = (): LocationEntity => {
  return faker.helpers.arrayElement(locations);
};
