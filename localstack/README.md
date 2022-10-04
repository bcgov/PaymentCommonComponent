### Local Stack Configuration



- Check if the localstack profile already exists
  
aws configure list-profiles | grep "localstack"

- If the profile does not exist create one

aws configure --profile localstack

Install `awslocal` https://docs.localstack.cloud/integrations/aws-cli/#localstack-aws-cli-awslocal


Dashboard function not available anymore

https://github.com/localstack/localstack/issues/4535#issuecomment-912360013


Use CLI skeleton to configure required services on localstack. 
    https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-skeleton.html


Create SalesDelivery Stream: 

awslocal firehose delete-delivery-stream --delivery-stream-name SalesDelivery
awslocal firehose  create-delivery-stream --cli-input-json file://./localstack/firehose/SalesDelivery.json

Put Event: 

awslocal firehose put-record --delivery-stream-name SalesDelivery --record Data=ewogICJJbnN1cmFuY2VDb21wYW5pZXMiOiAgIlNhbXBsZXMiCn0=
