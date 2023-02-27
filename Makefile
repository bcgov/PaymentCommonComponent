# Makefile

# Run in the bash context and not /bin/sh (default)
SHELL := /bin/bash

# Environment variables for project
export $(sed 's/=.*//' .env)
ENV := $(PWD)/.env
include $(ENV)

# Project
export PROJECT := pcc

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
workspaces { name = "$(LZ2_PROJECT)-$(ENV_NAME)" }
hostname     = "app.terraform.io"
organization = "bcgov"
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

# Terraform variables
TERRAFORM_DIR = terraform
export BOOTSTRAP_ENV=terraform/bootstrap

define TFVARS_DATA
target_env = "$(ENV_NAME)"
project_code = "$(PROJECT)"
lz2_code = "$(LZ2_PROJECT)"
db_username = "$(POSTGRES_USERNAME)"
build_id = "$(COMMIT_SHA)"
build_info = "$(LAST_COMMIT_MESSAGE)"
endef
export TFVARS_DATA

# Deployment
APP_SRC_BUCKET = $(LZ2_PROJECT)-$(ENV_NAME)-packages

# Set Vars based on ENV 
ifeq ($(ENV_NAME), dev) 
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_DEV)
DB_HOST = $(DB_HOST_DEV)
endif

ifeq ($(ENV_NAME), test) 
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_TEST)
DB_HOST = $(DB_HOST_TEST)
endif

ifeq ($(ENV_NAME), prod)
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_PROD)
DB_HOST = $(DB_HOST_PROD)
endif


.PHONY: 

check: 
	@./bin/tools.sh

# ======================================================================
# Terraform commands
# ======================================================================

config:
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

	@echo 'Updating prod dependencies...\n'
	@yarn workspaces focus @payment/backend --production

	@echo 'Pruning node modules...\n'
	# @npx --yes node-prune
	# @npx --yes modclean -n default:safe,default:caution -r

	@echo 'Deleting existing build dir...\n'
	@rm -rf ./.build || true

	@echo 'Creating build dir...\n'
	@mkdir -p .build

	@echo 'Copy Node modules....\n'
	@mv node_modules .build

	@echo 'Unlink local packages...\n'
	@rm -rf .build/node_modules/@payment/*
	
	@echo 'Copy backend ...\n' 
	@cp -r apps/backend/dist/* .build

	@echo 'Creating Zip ...\n'
	@cd .build && zip -r backend.zip .
	@cd ..

	@echo 'Copying to terraform build location...\n'
	@mv .build/backend.zip ./terraform/build/backend.zip


# ======================================================================
# AWS Deployments
# ======================================================================

# Full redirection to /dev/null is required to not leak env variables

aws-deploy-all:
	@aws lambda update-function-code --function-name paycocoapi --zip-file fileb://./terraform/build/backend.zip --region ca-central-1 > /dev/null
	@aws lambda update-function-code --function-name parser --zip-file fileb://./terraform/build/backend.zip --region ca-central-1 > /dev/null
	@aws lambda update-function-code --function-name reconciler --zip-file fileb://./terraform/build/backend.zip --region ca-central-1 > /dev/null

aws-deploy-migrator:
	aws lambda update-function-code --function-name migrator --zip-file fileb://./terraform/build/backend.zip --region ca-central-1 > /dev/null

# ======================================================================
# AWS Interactions
# ======================================================================

aws-sync-data-from-prod: 
	@aws s3 sync s3://pcc-integration-data-files-prod s3://pcc-integration-data-files-dev --acl bucket-owner-full-control
	@aws s3 sync s3://pcc-integration-data-files-prod s3://pcc-integration-data-files-test --acl bucket-owner-full-control

aws-run-migrator: 
	@rm migration-results || true
	@aws lambda invoke --function-name migrator --payload '{}' migration-results --region ca-central-1
	@cat migration-results | grep "success"

aws-run-reconciler:
	@aws lambda invoke --function-name reconciler --payload file://./apps/backend/fixtures/lambda/reconcile.json --region ca-central-1 --cli-binary-format raw-in-base64-out response.txt

aws-run-parser: 
	@aws lambda invoke --function-name parser  --payload file://./apps/backend/fixtures/lambda/parser.json --region ca-central-1 --cli-binary-format raw-in-base64-out response.txt

# ======================================================================
# CI 
# ======================================================================

run-test:
	@echo "+\n++ Make: Running test build ...\n+"
	@docker-compose -f docker-compose.test.yml up --build -d 
	
run-test-pipeline:
	@docker exec -i $(PROJECT)-backend-test yarn run test:pipeline

close-test:
	@echo "+\n++ Make: Closing test container ...\n+"
	@docker-compose -f docker-compose.test.yml down

lint: 
	@yarn workspace @payment/backend lint

# ======================================================================
# Local Development Environment & Testing
# ======================================================================

build:
	@docker-compose up --build -d --force-recreate

start: 
	docker-compose up -d 

stop: 
	@docker-compose down

wipe: 
	@docker-compose down -v --remove-orphans

be-logs:
	@docker logs $(PROJECT)-backend --follow --tail 25

# ===================================
# Local
# ===================================

parse:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/parser.ts").handler($(PARSER_JSON))'

# TODO update handler to accept args
reconcile:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/reconcile.ts").handler($(RECONCILE_JSON))'

report:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/report.ts").handler()'

report2:
	@docker exec -it $(PROJECT)-backend ./node_modules/.bin/ts-node -e 'require("./apps/backend/src/lambdas/report.ts").handler($(REPORT_JSON))'

clear: 
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "delete from public.payment"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "delete from public.transaction"


clear-status: 
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.payment set status='PENDING', pos_deposit_match=null,  cash_deposit_match=null;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.pos_deposit set status='PENDING';"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update public.cash_deposit set status='PENDING';"
	
drop:
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "DROP SCHEMA public CASCADE;"
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "CREATE SCHEMA public;"

unmark: 
	@docker exec -it $(PROJECT)-db psql -U postgres -d pcc  -c "update pos_deposit set match=false; update cash_deposit set match=false; update payment set match=false;"


# ===================================
# Migrations
# ===================================

migration-create:
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:create-migration

migration-revert: 
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:revert-migration

migration-run:
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:run-migrations

migration-generate:	  
	@docker-compose exec -T backend yarn workspace @payment/backend typeorm:generate-migration
	
    
# ===================================
# Local S3 Management
# ===================================

minio-init: 
	@mc alias set s3 http://localhost:9000 pcc password
	@mc mb s3/pcc-integration-data-files-local

minio-ls: 
	@mc ls s3/pcc-integration-data-files-local


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
	@echo "Host Instance Id: $(BASTION_INSTANCE_ID) | $(BASTION_INSTANCE_ID) | $(DOMAIN)\n"
	@echo "DB HOST URL: $(DB_HOST)\n"
	# Checking you have the SSM plugin for the AWS cli installed
	session-manager-plugin
	rm ssh-keypair ssh-keypair.pub || true
	ssh-keygen -t rsa -f ssh-keypair -N ''
	aws ec2-instance-connect send-ssh-public-key --instance-id $(BASTION_INSTANCE_ID) --instance-os-user ec2-user --ssh-public-key file://ssh-keypair.pub
	ssh -i ssh-keypair ec2-user@$(BASTION_INSTANCE_ID) -L 5454:$(DB_HOST):5432 -o ProxyCommand="aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"