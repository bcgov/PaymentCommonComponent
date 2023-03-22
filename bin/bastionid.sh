#!/bin/bash

aws ec2 describe-instances --filters 'Name=tag:Name,Values=pcc_dev-bastion'  --output text --query 'Reservations[*].Instances[*].InstanceId'