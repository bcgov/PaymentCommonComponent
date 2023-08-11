import { SNSEventRecord } from 'aws-lambda';
import { Ministries } from '../constants';

export interface ReconciliationEventMessage {
  reconciliationMaxDate: string;
  program: Ministries;
  reportEnabled: boolean;
  byPassFileValidity: boolean;
}

export interface SNSRecord {
  Sns: {
    Message: ReconciliationEventMessage;
  };
}

export interface BatchHandlerEvent {
  Records: SNSEventRecord[];
}

export interface HandlerEvent {
  reconciliationEventOverride: boolean;
  byPassFileValidity: boolean;
  period: {
    from: string;
    to: string;
  };
  program: Ministries;
  reportEnabled: boolean;
}
