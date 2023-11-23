
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![img](https://img.shields.io/badge/Lifecycle-Stable-97ca00)](https://github.com/bcgov/repomountie/blob/main/doc/lifecycle-badges.md)

![Tests](https://github.com/bcgov/common-hosted-form-service/workflows/Tests/badge.svg)

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

## Documentation

[Project Wiki](https://github.com/bcgov/PaymentCommonComponent/wiki)

[Confluence](https://bcdevex.atlassian.net/wiki/spaces/CCP/pages/1256882192/DROP+Decision+Log)

[API Flow](/docs/api_flow.png)

[Application Flow](/docs/application_flow.png)

[Automation Flow](/docs/automation_flow.jpg)

[Role Based Access Readme](docs/role_based_access.md)

[Role Based Access Diagram](docs/role_based_access.png)

[CI/CD Plan(TODO)](/docs/plans_for_automated_deployments.md)

[Data Rentention Plan](/docs/data_retention.md)


## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

    Copyright 2022 Province of British Columbia

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.