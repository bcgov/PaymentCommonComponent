import { faker } from '@faker-js/faker';
import { LocationEntitys } from './locations';
import { LocationEntity } from '../../../src/constants';

export const generateLocation = (): LocationEntity => {
  return faker.helpers.arrayElement(LocationEntitys);
};
