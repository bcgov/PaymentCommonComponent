## Payments Common Component

[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](Redirect-URL)

### Scope Of Project

TBD

### Technical Setup

Prerequisites:

- Docker
- Docker Compose
- Python 3 & pip
- AWS Cli V2 - (https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Localstack `awslocal` https://docs.localstack.cloud/integrations/aws-cli/#localstack-aws-cli-awslocal
- Cyberduck - To browse s3 files

#### Yarn Workspaces Setup

This project is setup using yarn workspaces for the lambda functions.

Yarn V2 is the latest version.

Yarn V2 needs to be enabled in node js versions 16 and above - Follow these steps to get yarn setup locally - https://yarnpkg.com/getting-started/install

### Running The Project Locally

Start apps/backend: `make run-local`

### Auto-Reconciliation Temp-Scripts

- Add BCM_SFTP and PCC_SFTP in a root .env

- Ensure you are connected to the cisco VPN

- Ensure you are connected to Localstack/Cyber Duck

- For the env vars reach out to anyone on the team, the format is: 'sftp://<username>@<server>'

- Run `make get-daily-recon-files`
