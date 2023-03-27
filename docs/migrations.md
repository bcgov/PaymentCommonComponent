#### Migrations Tracker:

[migration1679618910864](https://github.com/bcgov/PaymentCommonComponent/blob/9ba59fecf488e3779ad63a08d876f9941c8e1da3/apps/backend/src/database/migrations/1679618910864-migration.ts)

- Removed extra unused location from chetwynd

[migration1679699038149](https://github.com/bcgov/PaymentCommonComponent/blob/9ba59fecf488e3779ad63a08d876f9941c8e1da3/apps/backend/src/database/migrations/1679618910864-migration.ts)

- added a placeholder 'Bank' method location for Burnaby as we use this method to look up distinct location id for reconciliation

[migration1679618910864](https://github.com/bcgov/PaymentCommonComponent/blob/9ba59fecf488e3779ad63a08d876f9941c8e1da3/apps/backend/src/database/migrations/1679618910864-migration.ts)

- changed column type to numeric(16,2) in order to set the scale for storing dollar amounts to 2 decimal places
