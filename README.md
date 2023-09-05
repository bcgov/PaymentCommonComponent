## Payments Common Component

[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](Redirect-URL)

### MVP - Scope Of Project

- Reconciliation as a service for Ministry LoB

Data Source 1:

- Connecting to Provinical Treasury of the Province of British Columbia
  - Obtain and parse TDI34 files - In person PoS Transactions
  - Obtain and parse TDI17 files - Cash & Cheque deposits made to the banks
  - Obtain and parse TDI34 (DDF) files - Online card transactions (PayBC and ICE pay)

Date Source 2:

- Ministry LoB Sales transactions

### Technical Setup

Prerequisites:

- Run `make check` to make sure you have all the required dependency tools and binaries setup correctly.

#### Yarn Setup

Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally - https://yarnpkg.com/getting-started/install

#### Environment Variables

Create a .env file at the root prior to running the project

use the `.env.example` to create `.env`

#### Versioning

Run `make verison-major` to update the version for releases - this will also update the api path
Run `make verison-minor` to update small changes in which we do not want to update the api path
Run `make verison-patch` to update the version after implementing fixes for bugs etc - this will not update the api path. This is used to track fixes for testing etc. 

#### Running The Project Locally (Docker)

Use the make commands under the `docker` section to start the project.

Install dependencies - `yarn`
Run Project - `make build`

#### Gettings Access to tools and credentials

to run the project for development, the following is bare requirement:

- aws configuration for aws-pcc and minio [Example](./.config/credentials.example)
- rclone configuration [Example](./.config/rclone.conf.example)
- env file configuration [Example](./.config/.env.example)

Refer [here](./docs/access.md)

#### Populate the database

- Ensure you are connected to the cisco VPN
- Make sure the project is up and running by using the docker make commands
- Run `make migration-run` for the database to be setup.
- Run `make sync` to update your local environment with all the necessary files
- Run `make parse` to populate the db

## Developer Docs

- Once the project has been configured and all dependencies installed, after running `make build` (ensure project is running with docker ps) you can run `make dev-docs` to view compodoc/jsdocs generated documentation for the apps/backend application
- This takes a few minutes to build.
- Visit `http://localhost:8081` in the brower to view the docs
- To suppress the logs or make other configuration changes edit the compodoc.yaml file in the apps/backend directory.
- configuration options can be found [here](https://compodoc.app/guides/options.html)

### Reconciliation

- Make sure the project is up and running by using the docker make commands
- Make sure you have completed the steps above
- Edit the `apps/backend/fixtures/reconcile.json` file to specifiy config
- Run (from root) `make reconcile`

### Reporting

- Make sure the project is up and running by using the docker make commands
- Make sure you have completed the steps above
- Edit the `apps/backend/fixtures/report.json` file to specifiy config
- Run (from root) `make report`

### Notifications

For notifications, we are using GC Notify. The key can be found in the AWS Parameter Store.
The API documentation for GC Notify sits [here](https://documentation.notification.canada.ca/en/).

### Authentication

The app includes an authentication layer for all endpoints but healthcheck using by using the BCGov API Portal located at https://api.gov.bc.ca
Accounts will need to be generated on the portal by a user with API Provider permissions. This will generate a client id and secret for the payments API. This ID and Secret then must be used as the username/password in requests with Basic Auth.

An AuthGuard then makes a request to the API Portal using those credentials to retrieve a token if the account is valid. The AuthGuard is globally applied, except for instances defined by the @Public() decorator.
