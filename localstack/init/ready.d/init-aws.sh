#!/bin/bash


awslocal s3 mb s3://bc-pcc-data-files-local


# Buffering time and size not implemented currently :(
# https://github.com/localstack/localstack/blob/8192c1913ab9ec415418b9c8cb6eea7269748525/localstack/services/firehose/provider.py#L595

awslocal firehose  create-delivery-stream --region ca-central-1 --cli-input-json file:///etc/localstack/init/ready.d/firehose/SalesDelivery.json
