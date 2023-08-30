#!/bin/bash

ENV=${1?"Environment Parameter Missing !"}

aws ec2 describe-instances --filters "Name=tag:Name,Values=pcc_$ENV-bastion"  --output text --query "Reservations[*].Instances[*].InstanceId"   