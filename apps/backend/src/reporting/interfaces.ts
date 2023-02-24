import { Ministries } from '../constants';

export interface ReportConfig {
  program: Ministries;
  locations: number[];
  period: {
    from: Date;
    to: Date;
  };
  exceptions: {
    generate: boolean;
    send: boolean;
  };
  reports: boolean;
}
