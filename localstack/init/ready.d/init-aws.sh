#!/bin/bash


awslocal s3 mb s3://pcc-data
awslocal firehose  create-delivery-stream --cli-input-json file:///etc/localstack/init/ready.d/firehose/SalesDelivery.json
