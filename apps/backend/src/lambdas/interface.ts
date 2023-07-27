import { Ministries } from 'src/constants';

export interface ParseRecord {
  s3: {
    s3SchemaVersion: string;
    configurationId: string;
    bucket: {
      name: string;
      ownerIdentity: {
        principalId: string;
      };
      arn: string;
    };
    object: {
      key: string;
      size: string;
      eTag: string;
      versionId: string;
      sequencer: string;
    };
  };
}

export interface ParseEvent {
  Records: ParseRecord[];
}

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
