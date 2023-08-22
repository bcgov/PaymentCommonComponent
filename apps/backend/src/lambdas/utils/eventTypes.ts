// From https://gist.github.com/jeshan/52cb021fd20d871c56ad5ce6d2654d7b
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getLambdaEventSource = (event?: any) => {
  switch (event) {
    case event?.Records[0]?.cf:
      return 'isCloudfront';

    case event.configRuleId && event.configRuleName && event.configRuleArn:
      return 'isAwsConfig';

    case event.Records && event.Records[0].eventSource === 'awscodecommit':
      return 'isCodeCommit';

    case event.authorizationToken === 'incoming-client-token':
      return 'isApiGatewayAuthorizer';

    case event.StackId && event.RequestType && event.ResourceType:
      return 'isCloudFormation';

    case event.Records && event.Records[0].eventSource === 'awsses':
      return 'isSes';

    case event?.pathParameters?.proxy:
      return 'isApiGatewayAwsProxy';

    case event.source === 'aws.events':
      return 'isScheduledEvent';

    case event?.awslogs?.data:
      return 'isCloudWatchLogs';

    case event?.Records[0]?.EventSource === 'awssns':
      return 'isSns';

    case event?.Records[0]?.eventSource === 'awsdynamodb':
      return 'isDynamoDb';

    case event?.records[0]?.approximateArrivalTimestamp:
      return 'isKinesisFirehose';

    case event?.deliveryStreamArn?.startsWith('arnawskinesis'):
      return 'isKinesisFirehose';

    case event.eventType === 'SyncTrigger' &&
      event.identityId &&
      event.identityPoolId:
      return 'isCognitoSyncTrigger';

    case event.Records && event.Records[0].eventSource === 'awskinesis':
      return 'isKinesis';

    case event.Records && event.Records[0].eventSource === 'awss3':
      return 'isS3';

    case event.operation && event.message:
      return 'isMobileBackend';

    case event.Records && event.Records[0].eventSource === 'awssqs':
      return 'isSqs';

    case event.eventType === 'all':
      return 'all';
    default:
      return 'isUnknown';
  }
};
