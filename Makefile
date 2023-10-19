# Makefile

# Run in the bash context and not /bin/sh (default)
SHELL := /bin/bash

# Environment variables for project
export $(sed 's/=.*//' .env)
ENV := $(PWD)/.env
include $(ENV)

# Project
export PROJECT := pcc

# App Version
export APP_VERSION := $(shell cat apps/backend/package.json | jq '.version' -r)

# Environment
export ENV_NAME ?= dev
export PCC_SFTP :=  "$(PCC_SFTP)" 
export BCM_SFTP :=  "$(BCM_SFTP)"
export POSTGRES_USERNAME := $(AWS_POSTGRES_USERNAME)

# AWS Config
export AWS_DEFAULT_REGION := ca-central-1
export AWS_REGION ?= ca-central-1

# LZ2 Config
export LZ2_PROJECT = iz8ci7

# Terraform Cloud backend config variables      
define TF_BACKEND_CFG
bucket         = "terraform-remote-state-$(LZ2_PROJECT)-$(ENV_NAME)"  
key            = ".terraform/terraform.state"       
region         = "ca-central-1"                  
dynamodb_table = "terraform-remote-state-lock-$(LZ2_PROJECT)"  
encrypt        = true                              
endef
export TF_BACKEND_CFG

# Git
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
export LAST_COMMIT_MESSAGE:=$(shell git log -1 --oneline --decorate=full --no-color --format="%h, %cn, %f, %D" | sed 's/->/:/')
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export GIT_LOCAL_BRANCH := $(or $(GIT_LOCAL_BRANCH),dev)


# data 
REPORT_JSON:=$(shell cat ./apps/backend/fixtures/lambda/report.json | jq '.' -c)
RECONCILE_JSON:=$(shell cat ./apps/backend/fixtures/lambda/reconcile.json | jq '.' -c)
PARSER_JSON:=$(shell cat ./apps/backend/fixtures/lambda/parser.json | jq '.' -c)
BATCH_JSON:=$(shell cat ./apps/backend/fixtures/lambda/batch.json | jq '.' -c)

# Terraform variables
TERRAFORM_DIR = terraform
export BOOTSTRAP_ENV=terraform/bootstrap

ifeq ($(ENV_NAME), dev)
export DISABLE_AUTOMATED_RECONCILIATION=true
export AWS_ACCOUNT_ID := $(AWS_ACCOUNT_ID_DEV)
endif

ifeq ($(ENV_NAME), test)
export AWS_ACCOUNT_ID := $(AWS_ACCOUNT_ID_TEST)
endif

ifeq ($(ENV_NAME), prod)
export AWS_ACCOUNT_ID := $(AWS_ACCOUNT_ID_PROD)
endif

define TFVARS_DATA
app_version = "$(APP_VERSION)"
target_env = "$(ENV_NAME)"
target_aws_account_id = "$(AWS_ACCOUNT_ID)"
project_code = "$(PROJECT)"
lz2_code = "$(LZ2_PROJECT)"
db_username = "$(POSTGRES_USERNAME)"
build_id = "$(COMMIT_SHA)"
build_info = "$(LAST_COMMIT_MESSAGE)"
api_endpoint = "$(MAIL_SERVICE_DEFAULT_TO_EMAIL)"
mail_base_url = "$(MAIL_SERVICE_BASE_URL)"
mail_default_to = ""
disable_automated_reconciliation="$(DISABLE_AUTOMATED_RECONCILIATION)"
auth_base_url="$(AUTH_BASE_URL)"
endef
export TFVARS_DATA
# Deployment
APP_SRC_BUCKET = ${PROJECT}-deployments-${ENV_NAME}

# Set Vars based on ENV 
ifeq ($(ENV_NAME), dev) 
DB_HOST = $(DB_HOST_DEV)
endif

ifeq ($(ENV_NAME), test) 
DB_HOST = $(DB_HOST_TEST)
endif

ifeq ($(ENV_NAME), prod)
DB_HOST = $(DB_HOST_PROD)
endif


.PHONY: 

check: 
	@./bin/tools.sh

# ======================================================================
# Terraform commands
# ======================================================================

format:
	@terraform -chdir=$(TERRAFORM_DIR) fmt

config:format
	@echo "$$TFVARS_DATA" > $(TERRAFORM_DIR)/.auto.tfvars
	@echo "$$TF_BACKEND_CFG" > $(TERRAFORM_DIR)/backend.hcl

init: config
	@terraform -chdir=$(TERRAFORM_DIR) init -input=false \
		-reconfigure \
		-backend-config=backend.hcl -upgrade

plan: init
	@terraform -chdir=$(TERRAFORM_DIR) plan -no-color

apply: init 
	@terraform -chdir=$(TERRAFORM_DIR) apply -auto-approve -input=false

destroy: init
	@terraform -chdir=$(TERRAFORM_DIR) destroy

output: 
	@terraform -chdir=$(TERRAFORM_DIR) output

# ======================================================================
# Tag Based Deployments
# ======================================================================

pre-tag:
	@./scripts/check_rebase.sh
	
tag-dev:
	@git tag -fa dev -m "Deploy dev: $(git rev-parse --abbrev-ref HEAD)"
	@git push --force origin refs/tags/dev:refs/tags/dev

tag-test:
	@git tag -fa test -m "Deploy test: $(git rev-parse --abbrev-ref HEAD)"
	@git push --force origin refs/tags/test:refs/tags/test

tag-prod:
ifndef version
	@echo "++\n***** ERROR: version not set.\n++"
	@exit 1
else
	@git tag -fa $(version) -m "Release version: $(version)"
	@git push --force origin refs/tags/$(version):refs/tags/$(version)
	@git tag -fa prod -m "Deploy prod: $(version)"
	@git push --force origin refs/tags/prod:refs/tags/prod
endif


# ======================================================================
# Builds
# ======================================================================

clean: 
	@rm -rf apps/backend/dist 

pre-build:
	@echo "++\n***** Pre-build Clean Build Artifact\n++"
	@rm -rf ./terraform/build || true

	@mkdir -p ./terraform/build
	@echo "++\n*****"


build-backend: pre-build
	@yarn 

	@echo 'Building backend package... \n' 
	@yarn workspace @payment/backend build

	@mkdir -p terraform/build/backend

	@echo 'Creating build artifact'
	@cd ./apps/backend/dist && zip -r backend.zip *

	@echo 'Copying to terraform build location...\n'
	@cp ./apps/backend/dist/backend.zip ./terraform/build/backend/backend.zip


# ======================================================================
# AWS Deployments
# ======================================================================

# Full redirection to /dev/null is required to not leak env variables

# Uploads built backend zip bundle to s3://$APP_SRC_BUCKET/$COMMIT_SHA
aws-upload-artifacts:
	@aws s3 cp ./terraform/build/backend/backend.zip s3://$(APP_SRC_BUCKET)/$(COMMIT_SHA)/backend/backend.zip --region ca-central-1 --no-cli-pager

# Updates lambda functions to the lambda layer version and artifact located at s3://$APP_SRC_BUCKET/$COMMIT_SHA
aws-deploy-all:
	APP_SRC_BUCKET=$(APP_SRC_BUCKET) COMMIT_SHA=$(COMMIT_SHA) ./bin/deploy.sh aws-deploy-function paycocoapi parser reports reconciler dailyFileCheck batch_reconciler 

aws-deploy-dev-restricted-lambda:
	APP_SRC_BUCKET=$(APP_SRC_BUCKET) COMMIT_SHA=$(COMMIT_SHA) ./bin/deploy.sh aws-deploy-function clearDevData 

# Updates migrator lambda function to lambda layer version and artifact located at s3://$APP_SRC_BUCKET/$COMMIT_SHA
aws-deploy-migrator:
	APP_SRC_BUCKET=$(APP_SRC_BUCKET) COMMIT_SHA=$(COMMIT_SHA) ./bin/deploy.sh aws-deploy-function migrator

aws-build-and-deploy-all: build-backend aws-upload-artifacts aws-deploy-all

aws-build-and-deploy-migrator: build-backend aws-upload-artifacts aws-deploy-migrator

aws-build-and-deploy-aws-data-clear-lambda: build-backend aws-upload-artifacts aws-deploy-dev-restricted-lambda

# ======================================================================
# AWS Interactions
# ======================================================================

	

aws-sync-files-from-prod-to-dev:
	@aws s3 sync s3://pcc-integration-data-files-prod/bcm s3://pcc-integration-data-files-dev/bcm --acl bucket-owner-full-control
	@aws s3 sync s3://pcc-integration-data-files-prod/sbc s3://pcc-integration-data-files-dev/sbc --acl bucket-owner-full-control

aws-sync-files-from-prod-to-test:
	@aws s3 sync s3://pcc-integration-data-files-prod/sbc s3://pcc-integration-data-files-test/sbc --acl bucket-owner-full-control
	@aws s3 sync s3://pcc-integration-data-files-prod/bcm s3://pcc-integration-data-files-test/bcm --acl bucket-owner-full-control

aws-empty-s3-bucket-dev:
	@aws s3 rm s3://pcc-integration-data-files-dev/bcm --recursive
	@aws s3 rm s3://pcc-integration-data-files-dev/sbc --recursive

aws-run-migrator: 
	@rm migration-results || true
	@aws lambda invoke --function-name migrator --payload '{}' migration-results --region ca-central-1
	@cat migration-results | grep "success"

aws-run-clear-dev-data: 
	@touch clear-db-results || true
	@aws lambda invoke --function-name clearDevData --payload '{}' clear-db-results  --region ca-central-1
	@cat clear-db-results | grep "success"
	@rm clear-db-results

aws-run-reconciler:
	@aws lambda invoke --function-name reconciler --payload file://./apps/backend/fixtures/lambda/reconcile.json --region ca-central-1 --cli-binary-format raw-in-base64-out response.txt

aws-run-parser: 
	@aws lambda invoke --function-name parser  --payload file://./apps/backend/fixtures/lambda/parser.json --region ca-central-1 --cli-binary-format raw-in-base64-out response.txt

aws-run-reports: 
	@aws lambda invoke --function-name reports  --payload file://./apps/backend/fixtures/lambda/report.json --region ca-central-1 --cli-binary-format raw-in-base64-out response.txt


# ======================================================================
# CI 
# ======================================================================

run-test:
	@echo "+\n++ Make: Running test build ...\n+"
	@docker-compose -f docker-compose.ci.yml up --build -d --force-recreate

run-test-pipeline:
	@docker exec -i pcc-backend-test yarn run test:pipeline

run-test-coverage:
	@docker exec -i pcc-backend-test yarn run test:cov

close-test:
	@echo "+\n++ Make: Closing test container ...\n+"
	@docker-compose -f docker-compose.ci.yml down

lint: 
	@yarn workspace @payment/backend lint

# ======================================================================
# Local Development Environment & Testing
# ======================================================================
version: 
	echo $(APP_VERSION)

build:
	@docker-compose up --build -d --force-recreate

run-local:
	@docker-compose up -d 

start: 
	docker-compose up -d 

stop: 
	@docker-compose down

wipe: 
	@docker-compose down -v --remove-orphans

be-logs:
	@docker logs $(PROJECT)-backend --follow --tail 25

start-prod:
	@yarn workspace @payment/backend start:prod

# ===================================
# Local
# ===================================
batch-reconcile: 
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/batch-reconcile.ts").handler($(BATCH_JSON))'

parse:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/parser.ts").handler($(PARSER_JSON))'

reconcile:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/reconcile.ts").handler($(RECONCILE_JSON))'

report:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/report.ts").handler($(REPORT_JSON))'

alert:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/dailyfilecheck.ts").handler()'

clear-database:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/database/clear-dev-db.ts").handler()'

reset-status: 
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.payment set status='PENDING', pos_deposit_match=null, cash_deposit_match=null, heuristic_match_round=null,reconciled_on=null, in_progress_on=null;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.pos_deposit set status='PENDING', heuristic_match_round=null, reconciled_on=null, in_progress_on=null;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.cash_deposit set status='PENDING', reconciled_on=null, in_progress_on=null;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "DELETE FROM payment_round_four_matches_pos_deposit;"
	
from = 2023-04-01
to = 2023-05-20
reset-status-date:
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.payment set status='PENDING', pos_deposit_match=null, cash_deposit_match=null, heuristic_match_round=null where transaction in (select transaction_id from public.transaction where transaction_date >= '$(from)' AND transaction_date < '$(to)');"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.pos_deposit set status='PENDING', heuristic_match_round=null where transaction_date >= '$(from)' AND transaction_date < '$(to)';"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.cash_deposit set status='PENDING' where deposit_date >= '$(from)' AND deposit_date < '$(to)';"

drop:
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "DROP SCHEMA public CASCADE;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "CREATE SCHEMA public;"

	

# ===================================
# Migrations
# ===================================

migration-create:
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:create-migration

migration-revert: 
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:revert-migration

migration-run:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/database/migrate.ts").handler()'
	
migration-run-ci:
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:run-migrations

migration-generate:	  
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:generate-migration
	
    
# ===================================
# Local S3 Management
# ===================================

minio-init: 
	@mc alias set s3 http://localhost:9000 pcc password
	@mc mb s3/pcc-recon-reports-local || true
	@mc mb s3/pcc-integration-data-files-local || true
	@mc mb s3/pcc-master-data-local || true
	@mc cp --recursive apps/backend/master_data s3/pcc-master-data-local
# @mc event add s3/pcc-integration-data-files-local arn:minio:sqs::primary:nats --event put 


minio-ls: 
	@mc ls s3/pcc-integration-data-files-local/bcm
	@mc ls s3/pcc-integration-data-files-local/sbc

minio-rm:
	@mc rm --recursive --force s3/pcc-integration-data-files-local/bcm
	@mc rm --recursive --force s3/pcc-integration-data-files-local/sbc

minio-rm-archive:
	@mc rm --recursive --force s3/pcc-integration-data-files-local/archive
# ===================================
# SFTP Data Sync
# ===================================

sync:
	@./bin/sync.sh

# ===================================
# AWS Database Connection
# ===================================

open-db-tunnel:
	# Needs exported credentials for a matching LZ2 space
	@echo "Running for ENV_NAME=$(ENV_NAME)\n"
	@echo "Host Instance Id: $(shell ./bin/bastionid.sh $(ENV_NAME)) | $(DOMAIN)\n"
	@echo "DB HOST URL: $(DB_HOST)\n"
	# Checking you have the SSM plugin for the AWS cli installed
	session-manager-plugin
	rm ssh-keypair ssh-keypair.pub || true
	ssh-keygen -t rsa -f ssh-keypair -N ''
	aws ec2-instance-connect send-ssh-public-key --instance-id $(shell ./bin/bastionid.sh $(ENV_NAME))  --instance-os-user ec2-user --ssh-public-key file://ssh-keypair.pub
	ssh -i ssh-keypair ec2-user@$(shell ./bin/bastionid.sh $(ENV_NAME))  -L 5454:$(DB_HOST):5432 -o ProxyCommand="aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"

# ===================================
# Versioning
# ===================================

version-major:
	@yarn run version:major

version-minor:
	@yarn run version:minor

version-patch:
	@yarn run version:patch
	aws ec2-instance-connect send-ssh-public-key --instance-id $(BASTION_INSTANCE_ID) --instance-os-user ec2-user --ssh-public-key file://ssh-keypair.pub
	ssh -i ssh-keypair ec2-user@$(BASTION_INSTANCE_ID) -L 5454:$(DB_HOST):5432 -o ProxyCommand="aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"


# ===================================
# Project Documentation 
# ===================================

update-docs:
	@echo "+\n++ Updating docs: ...\n+"
	@./apps/docs/docs.sh

build-docs:
	@docker-compose up -d  --build docs 
	@echo "docs: http://localhost:3001"

run-docs:
	@docker-compose up -d docs 
	@echo "docs: http://localhost:3001"


# ===================================
# Developer Documentation 
# ===================================

dev-docs:
	@echo "Wait for 1 minute, then visit: http://localhost:8081"
	@docker exec -it $(PROJECT)-backend yarn run compodoc
	