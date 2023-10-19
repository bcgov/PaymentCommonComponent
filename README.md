# DROP - Discrepancy Report on Payments

![Production Deployment](https://img.shields.io/github/actions/workflow/status/bcgov/PaymentCommonComponent/deploy-test.yaml?label=production%20build&link=https%3A%2F%2Fgithub.com%2Fbcgov%2FPaymentCommonComponent%2Factions%2Fworkflows%2Fdeploy-prod.yaml)

![Test Deployment](https://img.shields.io/github/actions/workflow/status/bcgov/PaymentCommonComponent/deploy-test.yaml?label=test%20build&link=https%3A%2F%2Fgithub.com%2Fbcgov%2FPaymentCommonComponent%2Factions%2Fworkflows%2Fdeploy-test.yaml)

![Dev Deployment](https://img.shields.io/github/actions/workflow/status/bcgov/PaymentCommonComponent/deploy-zap-dev.yaml?label=dev%20build&link=https%3A%2F%2Fgithub.com%2Fbcgov%2FPaymentCommonComponent%2Factions%2Fworkflows%2Fdeploy-zap-dev.yaml)

DROP automates the manual process of finding and reporting discrepancies between line-of-business Ministry transactions and the Provincial Treasury's bank and cash management deposit files. 

Transaction data from Ministry sales represents one half of the data required is received is pushed to an STFP server.

Deposit data from Provincial Treasury of the Province of British Columbia is also obtained via sftp and comes in three formats:
- TDI34 files - In person POS Transactions
- TDI17 files - Cash & Cheque deposits made to the banks
- TDI34 (DDF) files - Online card transactions (PayBC and ICE pay)

These an automated job finds exceptions between the data in order resolve discrepancies. A daily report is generated and uploaded to the aws S3 bucket. 

## Table of Contents


1. [Getting Access to Payment Common Components Tools](#getting-access-to-payment-common-components-tools)
2. [Development Environment](#development-configuration)
3. [Installation](#installation)
4. [Running The Project](#running-the-project) 
5. [Developer Documentation](#developer-documentation)
6. [Project Documentation](#project-documentation)
7. [Database Documentation](#database-documentation)


## Getting Access to Payment Common Components Tools

#### Contact the product owner for the following: 

- [Teams channel](https://teams.microsoft.com/l/team/19%3a5fdb0810f6b1416b8709e53e2e6ffe51%40thread.tacv2/conversations?groupId=f56865b7-57f7-419c-903d-0611fc8b3b54&tenantId=6fdb5200-3d0d-4a8a-b036-d3685e359adc)
- [Rocket.chat](chat.developer.gov.bc.ca)
- [Jira - CCFPCM](https://bcdevex.atlassian.net/jira/software/c/projects/CCFPCM/boards/25)
- [Mural](https://app.mural.co/t/paymentcommoncomponent2120/m/paymentcommoncomponent2120/1654045590681/a8efeab89e64a0d1208307b553f4bd40a47018fe?wid=0-1654552668553&sender=f9175829-f8b8-409a-a914-02a545114131)

#### Contact the project team for the following: 

- [Github](https://github.com/bcgov/paymentCommonComponent/pulls)
- [ArgoCD](https://argocd-shared.apps.silver.devops.gov.bc.ca/)
- [AWS LZ2](https://oidc.gov.bc.ca/auth/realms/umafubc9/protocol/saml/clients/amazon-aws) - Project badge - `iz8ci7`



#### Getting access to secrets and ssh keys: 

Once you have access to AWS LZ2 platform, login to the any of the environments to get access to the following: 

- Database passwords
- AWS Local Config - Service Account Tokens

## Development Configuration

To run the project for development, the following is bare requirement:

- aws configuration for aws-pcc and minio [Example](./.config/credentials.example)
- rclone configuration [Example](./.config/rclone.conf.example)
- env file configuration [Example](./.config/.env.example)

## Installation

#### Technical Setup

Run this command to automatically check for the required prereqs or consult the list below:
```bash
make check
```

Prerequisites:
- docker 
- node v18
- corepack
- awscli
- jq
- terraform
- minio
- yarn2
- rclone


#### Yarn Setup

Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally: 

```bash
corepack enable

corepack prepare yarn@stable --activate
```

See [https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install) for more details

#### Node
This project config assumes node version 18. 


#### Environment Variables

Create a .env file:

```bash
cp .env.example .env
```
(Contact the team for the values)


## Running The Project

#### Local Setup (Docker)

Use the make commands under the `root/docker` section to start the project.

Install dependencies:
```bash
yarn
```
Run project:
```bash
make build
```


#### Populate the database

- Make sure the project is up and running by using the docker make commands

Set up minio:
```bash
make minio-init
```
Run migrations:
```bash
migration-run
```
Get data locally (choose option 1):
```bash
make sync
```
Parse data into the db:
```bash
make parse
```

#### Trigger the lambdas

Reconcile data:
- Edit the `apps/backend/fixtures/reconcile.json` file to specify config
```bash
make reconcile
```
Generate a report:
- Edit the `apps/backend/fixtures/report.json` file to specifiy config
```bash
make report
```

## Developer Documentation
The developer docs (compodoc) can be generated by running the following command. (Ensure you have already ran `make build`).  

The docs are a work in progress. If you would like to change any configurations or update the docs, configuration options can be found [here](https://compodoc.app/guides/options.html).

View the [docs](http://localhost:8081) in your browser by running:
```bash
make dev-docs
```

## Project Documentation

The project docs can be generated by running the following command. (Ensure you have already ran `make build`).  

View the [docs](http://localhost:3001) in your browser by running:
```bash
make docs
```

## Database Documentation

View the [docs](https://dbdocs.io/chelsea-EYDS/bcpcc)
(Password required - see team for password)