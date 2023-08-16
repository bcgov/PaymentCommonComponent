#!/bin/bash

#####
# Publishes the latest built layer to s3 and publishes a new lambda layer version
# Usage: aws-publish-layer
#####
function aws-publish-layer() {
  aws lambda publish-layer-version \
    --layer-name "pcc-dependencies" \
    --content S3Bucket=$APP_SRC_BUCKET,S3Key=$COMMIT_SHA/layer/nodejs.zip \
    --compatible-runtimes nodejs18.x \
    --region ca-central-1 \
    --output text \
    --query 'LayerVersionArn' \
    --no-cli-pager
}

function aws-get-latest-layer-version() {
  aws lambda list-layer-versions \
    --layer-name pcc-dependencies \
    --region ca-central-1 \
    --query 'LayerVersions[0].LayerVersionArn'
}

#####
# Updates the given lambda function to the latest code and layer version
# Usage: aws-update-function-code <function-name>
#####
function aws-update-function-code() {
  echo "Updating function code for $1...\n"
  aws lambda update-function-code \
    --function-name $1 \
    --s3-bucket=$APP_SRC_BUCKET \
    --s3-key=$COMMIT_SHA/backend/backend.zip \
    --region ca-central-1 \
    --no-cli-pager > /dev/null

  latest_layer_version="$(aws-get-latest-layer-version)"

  echo "Updating function layer for $1 to layer version $latest_layer_version"

  aws lambda update-function-configuration \
    --function-name $1 \
    --layers [$latest_layer_version] \
    --region ca-central-1 \
    --no-cli-pager > /dev/null
}

#####
# Updates the given lambda functions to the latest code and layer version
# Usage: aws-deploy-function <function-name> <function-name> ... (as many as you want)
#####
function aws-deploy-function() {
  for funct in "${@:2}"; do
    echo $funct
    aws-update-function-code $funct
  done
}

# Check if the function exists and execute the given command
if declare -f "$1" >/dev/null; then
  "$@" "${@:2}"
else
  echo "'$1' is not a known function name" >&2
  exit 1
fi
