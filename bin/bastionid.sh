#!/bin/bash

ENV_NAME=${1?"ENV_NAMEironment Parameter Missing !"}

aws ec2 describe-instances --filters "Name=tag:Name,Values=pcc_$ENV_NAME-bastion"  --output text --query "Reservations[*].Instances[*].InstanceId"