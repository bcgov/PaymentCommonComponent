import { DateRange } from './date-range';
import { Location } from '../types/interface';
import { Ministries } from '../../../../src/constants';

export class BaseData {
  public readonly dateRange: DateRange;
  public readonly location: Location;
  public readonly program: Ministries;

  constructor(dateRange: DateRange, location: Location, ministry: Ministries) {
    this.dateRange = dateRange;
    this.location = location;
    this.program = ministry;
  }
}
