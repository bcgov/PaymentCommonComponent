import { Ministries } from '../constants';

export interface ReconciliationMessage {
  program: Ministries;
  period: {
    from: string;
    to: string;
  };
  bypass_parse_validity?: boolean;
}

export interface SNSRecord {
  Sns: {
    Message: ReconciliationMessage;
  };
}

export interface EventSuccessSNSMessage {
  Records: SNSRecord[];
}
