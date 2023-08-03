## Payments Common Component

[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](Redirect-URL)

### MVP - Scope Of Project

- Reconciliation as a service for Ministry LoB

Data Source 1:

- Connecting to Provinical Treasury of the Province of British Columbia
  - Obtain and parse TDI34 files - In person PoS Trnasactions
  - Obtain and parse TDI17 files - Cash & Cheque deposits made to the banks
  - Obtain and parse TDI34 (DDF) files - Online card transactions (PayBC and ICE pay)

Date Source 2:

- Ministry LoB Sales transactions

### Technical Setup

Prerequisites:

- Run `make check` from the project root directory to make sure you have all the required dependency tools and binaries setup correctly.

#### Yarn Setup

Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally - https://yarnpkg.com/getting-started/install

#### Environment Variables

Create a .env file at the root prior to running the project

use the `.env.example` to create `.env`

#### Running The Project Locally (Docker)

Use the make commands under the `root/docker` section to start the project.

Install dependencies (from root) - `yarn`
Run Project (from root) - `make build`

#### Gettings Access to tools and credentials

to run the project for development, the following is bare requirement:

- aws configuration for aws-pcc and minio [Example](./.config/credentials.example)
- rclone configuration [Example](./.config/rclone.conf.example)
- env file configuration [Example](./.config/.env.example)

Refer [here](./docs/access.md)

#### Populate the database

- Make sure the project is up and running by using the docker make commands
- Run (from root) `make migration-run` for the database to be setup.
- Run (from root) `make sync` to update your local environment with all the necessary files
- Run (from root) `make parse` to populate the db
- Refer [here](./docs/migrations.md)

## Developer Docs

- Once the project has been configured and all dependencies installed, after running `make build` (ensure project is running with docker ps) you can run `make dev-docs` to view compodoc/jsdocs generated documentation for the apps/backend application
- This takes a few minutes to build.
- Visit `http://localhost:8081` in the brower to view the docs
- To suppress the logs or make other configuration changes edit the compodoc.yaml file in the apps/backend directory.
- configuration options can be found [here](https://compodoc.app/guides/options.html)

### Reconciliation
##### How To Run On local:
- Make sure the project is up and running by using the docker make commands
- Make sure you have completed the steps above
- In order to run the reconciliation on the entire dataset as though it had run daily we should use the file metadata and filename (for SBC json files) to extract the date and run reconciliation based on that date.
- Parsing, reconciliation and reports are all automated by default. When you run sync/parse the entire dataset will be reconciled (job is >1 hr but should only need to run once per env unless you drop your db)
  - run: ‘make drop', ‘make migrations-run’, ‘make sync’, 'make parse’
- Reconciliation can be run manually (only runs for the specified dates, does not batch):
  - run: 'make reconcile' and update reconcile.json
- Automated reconciliation can be turned off:
  - set DISABLE_AUTOMATED_RECONCILIATION=true
- Automated reports can be set to false in the reconciliation input:
  - "generateReport": false
- Reports can be generated manually
  - run 'make report' after updating report.json
- If you do not want to re-parse your data, or you only want to batch reconcile some of the data:
  - run 'make batch-reconcile' (uses default inputs for Jan 1 to current date, these can be overridden in batch.json)

##### How It Runs On Dev/Test:

- Whenever data is dropped into the S3 bucket, either manually or via the sync job, it will be parsed and reconciled and will generate a report

- On dev, if you want to use the manual overrides you should drop your test data into the db and allow it to be parsed. Then, run the queries to reset the status to the pre-reconciled state. Now you can use the test tab in the lambdas to run manually.

### Reporting

- Make sure the project is up and running by using the docker make commands
- Make sure you have completed the steps above
- Edit the `apps/backend/fixtures/report.json` file to specifiy config
- Run (from root) `make report`
