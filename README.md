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

- Run `make check` to make sure you have all the required dependency tools and binaries setup correctly. 
  
  
#### Yarn Setup

Yarn V2 needs to be enabled. Follow these steps to get yarn setup locally - https://yarnpkg.com/getting-started/install

#### Environment Variables

Create a .env file at the root prior to running the project

use the `.env.example` to create `.env` 

#### Running The Project Locally (Docker)

Use the make commands under the `docker` section to start the project.

Install dependencies - `yarn`
Run Project - `make build-local`

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