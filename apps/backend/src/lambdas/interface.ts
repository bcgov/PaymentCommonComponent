export interface Record {
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
  Records: Record[]
}
