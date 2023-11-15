#!/bin/bash

ENV_NAME=${1?"ENV_NAMEironment Parameter Missing !"}
HOST=${2?"Host Parameter Missing !"}

ROLE_ARN=""

if [[ $ENV_NAME == "dev" ]]; then
    ROLE_ARN="arn:aws:iam::279397349124:role/PBMMOps-BCGOV_dev_Project_Role_CI_Role"
elif [[ $ENV_NAME == "tools" ]]; then
    ROLE_ARN="arn:aws:iam::307961689092:role/PBMMOps-BCGOV_tools_Project_Role_CI_Role"
elif [[ $ENV_NAME == "test" ]]; then
    ROLE_ARN="arn:aws:iam::289110186100:role/PBMMOps-BCGOV_test_Project_Role_CI_Role"
elif [[ $ENV_NAME == "prod" ]]; then
    ROLE_ARN="arn:aws:iam::953134788580:role/PBMMOps-BCGOV_prod_Project_Role_CI_Role"
fi

if [[ $HOST == "local" ]]
then
    eval $(aws sts assume-role --profile pcc-aws --role-arn $ROLE_ARN --role-session-name pcc-$ENV_NAME | jq -r '.Credentials | "export AWS_ACCESS_KEY_ID=\(.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=\(.SecretAccessKey)\nexport AWS_SESSION_TOKEN=\(.SessionToken)\n"')
fi