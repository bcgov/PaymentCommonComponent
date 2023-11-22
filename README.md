# DROP - Discrepancy Report on Payments

DROP automates the manual process of finding and reporting discrepancies between
the ministry line of business transactions and Provincial Treasury’s bank and
cash management deposit files.

Payment-transaction data from the line-of-business represents one half of the
data and is received via STFP.

Deposit data from Provincial Treasury of the Province of British Columbia is
also obtained via SFTP and comes in three formats:

- TDI34 files - In-person point-of-sale (POS) transactions
- TDI17 files - Cash & cheque deposits made to the banks
- TDI34 Daily Download Files (DDF) - Online card transactions (PayBC and ICE
  Pay)

Files are pushed to SFTP and transferred to S3 which triggers a lambda to parse
the data into the db. This triggers a subsequent lambda which runs the job of
searching for discrepancies in the data and updating the “status” of each row
item. After this process has completed, another lambda is triggered to generate
and output a report to another S3 bucket.

There is also an alerting and notification lambda which notifies users if data
files are missing, or if there are errors in the files during parsing.

## Table of Contents

1. [Tech](#tech)
2. [Setup](#setup)
   - [Tools Check](#tools-check)
   - [AWS Minio Credentials](#aws-minio-credentials)
   - [AWS Minio Config](#aws-minio-config)
   - [rclone Config](#rclone-config)
   - [Environment Variables](#environment-variables)
   - [Yarn](#yarn)
3. [Running The Project](#running-the-project)
   - [Docker](#docker)
   - [Database](#database)
   - [Lambdas](#lambdas)
4. [Features](#features)
5. [Tests](#tests)
6. [Documentation](#documentation)
   - [Developer Documentation](#developer-documentation)
   - [Project Documentation](#project-documentation)
7. [Support](#tools-and-support)
   - [Communication](#communication)
   - [Development Tools](#development-tools)
   - [Secrets and Keys](#secrets-and-keys)
8. [Deployment](#deployment)
   - [Prod](#prod)
   - [Test](#test)
   - [Dev](#dev)
   - [Tools](#tools)
11. [API Endpoints](#api-endpoints)
10. [Supplementary Documentation](#supplementary-documentation)

## Tech

- Database: Postgres
- Framework: NestJS
- Deployments: Lambda/Simple Notification Service/App Gateway on AWS
- File Ingestion: SFTP and AWS Transfer Family
- Report and File Storage: AWS S3
- Alerting: GC Notify

## Setup

#### Tools Check

Run this command to automatically check for the required prereqs or consult the
list below:
```bash
make check
```

These tools can be installed using [homebrew](https://brew.sh/):
```bash
/bin/bash -c “$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)”
```

- docker
- docker-compose
- node v18
- postgres v14
- corepack
- yarn2
- AWS
- jq
- terraform
- minio
- nestjs-cli
- rclone

#### AWS Minio Credentials

Generate or update aws-pcc and minio credentials:
```bash
cp .config/credentials.example ~/.aws/credentials
```

Example:

        [pcc-aws]

        aws_access_key_id = <KEY>
        aws_secret_access_key = <SECRET>

        [minio]

        aws_access_key_id = <KEY>
        aws_secret_access_key = <SECRET>

#### AWS Minio Config

Generate or update AWS config:

```bash
cp .config/config.example ~/.aws/config
```

Example:

        [profile pcc-aws]

        region = ca-central-1
        output = json

        [profile minio]

        region = ca-central-1
        output = json

#### rclone Config

Generate rclone.conf:

```bash
cp .config/rclone.conf.example ~/.config/rclone/rclone.conf
```

Example:

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

To generate the .env file run:

```bash
cp .config/.env.example .env
```

[Example](https://github.com/bcgov/PaymentCommonComponent/blob/CCFPCM-642/.config/.env.example)

Contact the team to fill in any missing variables.

#### Yarn

Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally:
```bash
corepack enable

corepack prepare yarn@stable --activate
```

See
[https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install)
for more details.

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

### Lambdas

This application is consists of several lambdas which are connected together
through various triggers on AWS in production. To run and test the individual
lambdas locally you can run the following commands:

#### Migrate

```bash
make migrations-run
```

#### Parse

```bash
make parse
```

#### Reconcile

- Edit the `apps/backend/fixtures/reconcile.json` file to specify config

```bash
make reconcile
```

#### Alert

```bash
make alert
```

#### Report

- Edit the `apps/backend/fixtures/report.json` file to specify config

```bash
make report
```

## Features

#### File Parsing

- Files are pushed to SFTP and transferred to S3 which triggers a lambda to
  parse the data into the db
- Files may also be directly dropped into the S3 bucket
- Amazon SNS is used to trigger the reconciliation lambda

#### Data Reconciliation

- Lambda searches for discrepancies in the data and updates the “status” of each
  row item
- After this process has completed another lambda is triggered to generate and
  output a report to another S3 bucket

#### Reporting

- Daily report is triggered by the Reconciliation Lambda/SNS
- Report is generated and uploaded to the S3 bucket

#### Notifications

- Notifies users if data files are missing, or if there are errors in the files
  during parsing
- For notifications, we are using GC Notify. The key can be found in the AWS
  Parameter Store
- The API documentation for GC Notify sits
  [here](https://documentation.notification.canada.ca/en/)

#### Authentication

The app includes an authentication layer for all endpoints but health check
using by using the BCGov API Portal located at https://api.gov.bc.ca

Accounts will need to be generated on the portal by a user with API Provider
permissions. This will generate a client id and secret for the payments API.
This ID and Secret then must be used as the username/password in requests with
Basic Auth.

An AuthGuard then makes a request to the API Portal using those credentials to
retrieve a token if the account is valid. The AuthGuard is globally applied,
except for instances defined by the @Public() decorator.

#### Versioning

Run `make version-major` to update the version for releases - this will also
update the api path.

Run `make version-minor` to update small changes in which we do not want to
update the api path.

Run `make version-patch` to update the version after implementing fixes for bugs
etc - this will not update the api path. This is used to track fixes for testing
etc.

## Tests

Build the test container:
```bash
make run-test
```

Run tests:
```bash
make run-test-pipeline
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

The docs are a work in progress. Configuration options can be found
[here](https://compodoc.app/guides/options.html).

#### Project Documentation

These are build with slate - currently WIP. To continue to develop these docs checkout the docs branch. 

The docs can be generated by running the following commands:

```bash
make build
```

```bash
make build-docs
```

## Support

#### Communication:

Contact the product owner for the following:

- [Teams channel](https://teams.microsoft.com/l/team/19%3a5fdb0810f6b1416b8709e53e2e6ffe51%40thread.tacv2/conversations?groupId=f56865b7-57f7-419c-903d-0611fc8b3b54&tenantId=6fdb5200-3d0d-4a8a-b036-d3685e359adc)

- [Rocket.chat](chat.developer.gov.bc.ca)

- [Jira - CCFPCM](https://bcdevex.atlassian.net/jira/software/c/projects/CCFPCM/boards/25)

#### Development Tools:

Contact the dev team for the following:

- [Github](https://github.com/bcgov/paymentCommonComponent)

- [AWS LZ2](https://loginproxy.gov.bc.ca/auth/realms/public-cloud/protocol/saml/clients/amazon-AWS)

#### Secrets and Keys:

Once you have access to AWS LZ2 platform, login to any of the environments using
your IDIR credentials to get access to the following:

The following can be found in AWS Systems Manager’s Parameter Store on prod

Project .env file under pcc/.env

Database passwords under pcc/prod/postgres/password

AWS Local Config - Service Account Tokens

## Deployments

Command Reference:

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

Deployments and builds are initiated via GitHub actions.

We have four environments: tools, dev, test, and prod - with an associated
GitHub Actions YAML file for each.

Deployments should be done on the lower envs prior to deployment to prod.

### TOOLS

- Developers use this environment for testing, deploying open pull requests, and
  debugging purposes
- This is “owned” by the developers
- Data does not automatically sync into this environment
- To upload data manually, you can use the AWS console to add data to the S3
  bucket, or alternatively, you can manually sync production data using the
  GitHub action triggered by a manual workflow called “manually sync prod data
  to tools.”
- Additionally, you have the option to clear out the S3 bucket and database on
  this environment by using the GitHub action triggered manually, named “clear
  all data tools.”
- To deploy to tools:
  - Run make tag-tools from the command line
    - You can deploy open pull requests to the tools environment, allowing you
      to verify the build and deployment process
  - Reminder: For any infrastructure updates via Terraform, you must manually
    run make plan and make apply from the command line.

### DEV

- This environment is where most of the testing will take place and is “owned”
  by the QA analyst
- Data does not automatically sync into this environment
- Only the parsing of files from S3 to the database is automated, all other
  lambdas must be manually triggered
- You may manually upload data via AWS console into the S3 bucket, or you can
  manually sync the prod data in using the GitHub action with a manual workflow
  trigger called “manually sync prod data to dev”
- Similarly, you can clear out the S3 bucket and database on dev by using the
  GitHub action with a manual workflow trigger called “clear all data dev”
- To deploy to dev:
  - First, deploy to tools: run make tag-tools from the command line
    - This deployment to tools can be done with open PRs and used to verify the
      build and deployment process
  - Next, deploy to dev: run make tag-dev from the command line
  - Reminder: For any infrastructure updates via Terraform, you must manually
    run make plan and make apply from the command line.

### TEST

- This is our staging environment which closely mirrors the production
  environment
- The data from prod is automatically synced into test
- Parsing, reconciliation and report generation are all automated in this
  environment (as they are on prod)
- Do not manually trigger the lambdas in this environment
- Testing should be done with the existing data, as it is (vs upload test cases
  etc)
- To deploy to test:
  - First, deploy to dev: run make tag-dev from the command line
    - Verify the build and run any tests that should run on dev
    - Ensure that you have received approval from QA analyst
  - Next, deploy to test: run make tag-test from the command line
  - Reminder: For any infrastructure updates via Terraform, you must manually
    run make plan and make apply from the command line.

### PROD

- Requires an approver
- Initiate the deployment by tagging a release, ie: git tag 2.0.0 && git push
  origin 2.0.0
- To deploy to prod:
  - First, deploy this tag to dev: run make tag-dev from the command line
    - Verify the build and run any tests that should run on dev
  - Next, deploy this tag to test: run make tag-test from the command line
    - Ensure QA sign-off is complete on the release
  - Once approved by the Quality Assurance Analyst, make sure to get approval
    from the Product Owner (PO) before deploying to prod
    - This will initiate the production deployment (P.O. sign off is required)
  - Reminder: For any infrastructure updates via Terraform, you must manually
    run make plan and make apply from the command line.

## API Endpoints


[TOOLS]()
[DEV](https://ee1uqiu7x1.execute-api.ca-central-1.amazonaws.com/api)
[TEST]()
[PROD](https://9denw8b5gb.execute-api.ca-central-1.amazonaws.com/api)

## Supplementary Documentation

[Confluence](https://bcdevex.atlassian.net/wiki/spaces/CCP/pages/1256882192/DROP+Decision+Log)

[API Flow](/docs/api_flow.png)

[Application Flow](/docs/application_flow.png)

[Automation Flow](/docs/automation_flow.jpg)

[Role Based Access Readme](docs/role_based_access.md)

[Role Based Access Diagram](docs/role_based_access.png)

[CI/CD Plan(TODO)](/docs/plans_for_automated_deployments.md)

[Data Rentention Plan](/docs/data_retention.md)


## Useful Links

[Cloud Pathfinder](https://loginproxy.gov.bc.ca/auth/realms/public-cloud/protocol/saml/clients/amazon-aws)

[API services portal](https://api.gov.bc.ca)

[Team MIRO](https://miro.com/app/board/uXjVMTLiVk4=/)


