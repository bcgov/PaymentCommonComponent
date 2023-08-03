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

export interface HandlerEvent {
  reconciliationEventOverride: boolean;
  byPassFileValidity: boolean;
  period: {
    from: string;
    to: string;
  };
  program: Ministries;
  generateReport: boolean;
}
