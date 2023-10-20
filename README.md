# DROP - Discrepancy Report on Payments
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](<Redirect-URL>)

DROP automates the manual process of finding and reporting discrepancies between line-of-business Ministry transactions and the Provincial Treasury's bank and cash management deposit files. 

Transaction data from Ministry sales represents one half of the data and is received via STFP.

Deposit data from Provincial Treasury of the Province of British Columbia is also obtained via sftp and comes in three formats:
- TDI34 files - In person POS Transactions
- TDI17 files - Cash & Cheque deposits made to the banks
- TDI34 (DDF) files - Online card transactions (PayBC and ICE pay)

Files are pushed to sftp and transfered to S3 which triggers a lambda to parse the data into the db. This triggers a subsequent lambda which runs the job of searching for discrepencies in the data and updating the "status" of each row item. After this process has completed another lambda is triggered to generate and output a report to another S3 bucket. 

There is also an alerting and notification lambda which notifies users if data files are missing, or if there are errors in the files during parsing. 

## Table of Contents


1. [Tech](#tech)
2. [Setup](#setup)
    a. [Requirements](#requirements)
    b. [Environment Variables](#environment-variables)
    b. [Tools](#tools)
    c. [Yarn](#yarn)
    d. [Node](#node)
3. [Running The Project](#running-the-project) 
    a. [Docker](#docker)
    b. [Database](#database)
    c. [Lambdas](#lambdas)
4. [Features](#features)
5. [Tests](#tests) 
6. [Documentation](#documentation)
    a. [Developer Documentation](#developer-documentation)
    b. [Project Documentation](#project-documentation)
    c. [Database Documentation](#database-documentation)
7. [Tools and Support](#tools-and-support)
    a. [Communication](#communication)
    b. [Development Tools](#development-tools)
    c. [Secrets and Keys](#secrets-and-keys)
    

## Tech

- Database: Postgres
- Framework: NestJS
- Deployments: Lambda/Simple Notification Service/App Gateway on AWS
- File Ingestion: SFTP and AWS Transfer Family
- Report and File Storage: AWS S3
- Alerting: GC Notify


## Setup

#### Development Tools

Run this command to automatically check for the required prereqs or consult the list below:
```bash
make check
```

- docker 
- docker-compose
- node v18
- postgres v14
- corepack
- yarn2
- awscli
- jq
- terraform
- minio
- nestjs-cli
- rclone

#### Requirements

To run the project for development, the following is bare requirement:
- aws configuration for aws-pcc and minio [Example](./.config/credentials.example)
        
        [pcc-aws]
        aws_access_key_id = <KEY>
        aws_secret_access_key = <SECRET>

        [minio]
        aws_access_key_id = <KEY>
        aws_secret_access_key = <SECRET>

- rclone configuration [Example](./.config/rclone.conf.example)
        
        [s3]
        type = s3
        provider = AWS
        env_auth = true

        [minio]
        type = s3
        provider = Minio
        env_auth = true
        access_key_id = pcc
        secret_access_key = <LOCAL_MINIO_PASSWORD>
        endpoint = http://localhost:9000

#### Environment Variables

- env file configuration:

        ######################
        # Project
        ######################
        PROJECT=pcc

        ######################
        # SFTP
        ######################
        BCM_SFTP=

        ######################
        # Local Database
        ######################
        DB_HOST=localhost
        DB_NAME=pcc
        DB_USER=postgres
        DB_PASSWORD=postgres
        DB_ROOT_PASSWORD=postgres
        DB_PORT=5432

        ######################
        # AWS Postgres
        ######################
        AWS_POSTGRES_USERNAME=

        ######################
        # DB Tunnel
        ######################

        DB_HOST_DEV=
        DB_HOST_PROD=
        DB_HOST_TEST=
        BASTION_INSTANCE_ID_DEV=
        BASTION_INSTANCE_ID_PROD=
        BASTION_INSTANCE_ID_TEST=

        NODE_ENV=local
        RUNTIME_ENV=local

        API_URL=http://localhost:3000/api

        MAIL_SERVICE_BASE_URL=https://api.notification.canada.ca
        MAIL_SERVICE_KEY=
        MAIL_SERVICE_DEFAULT_TO_EMAIL=test.account@mailinator.com
        AUTH_BASE_URL=https://dev.loginproxy.gov.bc.ca/auth/realms/apigw
        AWS_REGION=ca-central-1
        DISABLE_AUTOMATED_RECONCILIATION=false
        AWS_ENDPOINT='http://minio:9000'
        SNS_TRIGGER_REPORT_TOPIC_ARN=
        SNS_TRIGGER_RECONCILIATION_TOPIC_ARN=
        AWS_ACCOUNT_ID_DEV=
        AWS_ACCOUNT_ID_TEST=


#### Yarn
Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally: 

```bash
corepack enable

corepack prepare yarn@stable --activate
```

See [https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install) for more details


## Running The Project

#### Docker

Use the make commands under the `root/docker` section to start the project.

Install dependencies:
```bash
yarn
```
Run project:
```bash
make build
```

#### Database

- Make sure the project is up and running by using the docker make commands

Set up minio:
```bash
make minio-init
```
Run migrations:
```bash
make migration-run
```
Get data locally (choose option 1):
```bash
make sync
```
Parse data into the db:
```bash
make parse
```

#### Lambdas
This application is consists of several separate lambdas which are connected together through various triggers on aws in production. To run and test the individual lambdas locally you can run the following commands: 

#### Migrate
```bash
make migrations-run
```
#### Parse
```bash
make parse
```
#### Reconcile
- Edit the `apps/backend/fixtures/reconcile.json` file to specifiy config
```bash
make reconcile
```
#### Alert
```bash
make alert
```
#### Report

- Edit the `apps/backend/fixtures/report.json` file to specifiy config
```bash
make report
```

## Features

#### File Parsing

- Files are pushed to sftp and transfered to S3 which triggers a lambda to parse the data into the db. 
- Files may also be directly dropped into the S3 bucket.
- Amazon SNS is used to trigger the reconciliation lambda

#### Data Reconciliation

- Lambda searches for discrepencies in the data and updates the "status" of each row item. 
- After this process has completed another lambda is triggered to generate and output a report to another S3 bucket. 


#### Reporting

- Daily report is triggered by the Reconciliation Lambda/SNS
- Report is generated and uploaded to the S3 bucket


#### Notifications
- Notifies users if data files are missing, or if there are errors in the files during parsing. 
- For notifications, we are using GC Notify. The key can be found in the AWS Parameter Store.
- The API documentation for GC Notify sits [here](https://documentation.notification.canada.ca/en/).

#### Authentication

The app includes an authentication layer for all endpoints but healthcheck using by using the BCGov API Portal located at https://api.gov.bc.ca
Accounts will need to be generated on the portal by a user with API Provider permissions. This will generate a client id and secret for the payments API. This ID and Secret then must be used as the username/password in requests with Basic Auth.

An AuthGuard then makes a request to the API Portal using those credentials to retrieve a token if the account is valid. The AuthGuard is globally applied, except for instances defined by the @Public() decorator.

#### Versioning

Run `make verison-major` to update the version for releases - this will also update the api path
Run `make verison-minor` to update small changes in which we do not want to update the api path
Run `make verison-patch` to update the version after implementing fixes for bugs etc - this will not update the api path. This is used to track fixes for testing etc. 


## Running Tests

Build the test container:
```bash
make run-test
```

Run tests:
```bash
make run-test-pipeline
```

## Deployment
Build backend:
```bash
make build-backend
```

Terraform:
```bash
make plan
```

```bash
make apply
```
Tag Based Deployments:
```bash
make tag-<env>
```

## Documentation

#### Developer Documentation
The developer docs (compodoc) can be generated by running the following command:

```bash
make build
```
```bash
make dev-docs
```
The docs are a work in progress. Configuration options can be found [here](https://compodoc.app/guides/options.html).

#### Project Documentation

The project docs can be generated by running the following commands:

```bash
make build
```
```bash
make build-docs
```


#### Database Documentation
- [Database Documentation](https://dbdocs.io/chelsea-EYDS/bcpcc)
(Password required - see team for password)

## Support

#### Communication: 
Contact the product owner for the following:

- [Teams channel](https://teams.microsoft.com/l/team/19%3a5fdb0810f6b1416b8709e53e2e6ffe51%40thread.tacv2/conversations?groupId=f56865b7-57f7-419c-903d-0611fc8b3b54&tenantId=6fdb5200-3d0d-4a8a-b036-d3685e359adc)
- [Rocket.chat](chat.developer.gov.bc.ca)
- [Jira - CCFPCM](https://bcdevex.atlassian.net/jira/software/c/projects/CCFPCM/boards/25)

#### Development Tools: 
Contact the dev team for the following:
- [Github](https://github.com/bcgov/paymentCommonComponent)
- [AWS LZ2](https://loginproxy.gov.bc.ca/auth/realms/public-cloud/protocol/saml/clients/amazon-aws) 


#### Secrets and Keys: 

Once you have access to AWS LZ2 platform, login to the any of the environments to get access to the following: 

- Database passwords
- AWS Local Config - Service Account Tokens