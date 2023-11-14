#!/bin/bash

set -e

TOKEN=${1?"Enter TFC Token !"}
ENV_NAME=${2?"Enter ENV !"}

curl \
    -H "Authorization: Bearer $TOKEN" \
    -X GET \
    https://app.terraform.io/api/v2/organizations/bcgov/workspaces/uux0vy-$ENV_NAME |
    jq -r '.data.relationships."current-run".data.id'
