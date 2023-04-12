# Reconciliation

---

## Introduction

The goal is to simplify and automate the process that compares two set of records (TDI files to Sales) to verify that financial figures are correct and in agreement. Reconciliation is used to prevent balance sheet errors on financial accounts, check for fraud, and to reconcile the general ledger.

## Table of Contents

1. [POS Reconciliation](#pos-reconciliation)
1. [Cash Reconciliation](#cash-reconciliation)

## POS Reconciliation

Reconciliation should run daily for each SBC location. On each run it will check all dates for all locations starting from the lambdas event input “from_date”, currently 01-01-2023, up to the event lambda "to_date". It will only attempt to match “PENDING” payments and deposits. If there are no such payments, the system will skip that day.

### POS Match Criteria

Payments and deposits must match 1-1 and must match on all of the following heuristics. If no match is found an exception is thrown.

1.  Status (_pos_deposit.status_ === PENDING / _payment_status_ === PENDING)
2.  Location (_pos_deposit.merchant_id ---> payment.transaction.location_id_)
3.  Transaction Date (_pos_deposit transaction_date ---> payment.transaction transaction_date_)
4.  Amount (_pos_deposit transaction_amt_ ---> _payment amount_)
5.  Payment Method (_pos_deposit.card_vendor ---> payment.method_)
6.  TimeDiff < 240 s diff (_pos_deposit transaction_time ---> payment.transaction transaction_time_)
7.  TimeDiff < 24 h diff (_pos_deposit transaction_time ---> payment.transaction transaction_time_)

#### Entities and Relationships

- POSDepositEntity
  - TDI34 (pos) deposit
  - pos_deposit table
- TransactionEntity
  - Transaction JSON from SBC sftp server (will come from API in the future)
  - transaction table
  - one transactions -> many payments
- PaymentEntity
  - Payment entry from the payments array of a transaction
  - payment table
  - one to one matching for payment row <-> pos_deposit row
- PaymentMethodEntity
  - Lookup table to find matching payment methods for pos
  - pos_deposit card_vendor is the same as the payment_method method, which has a corresponding SBC garms payment_method code (numbered code)
- LocationEntity
  - Lookup table to find corresponding location
  - master_location_data table
  - pos_deposit merchant_id will match to a corresponding location_id in this table

### POS Reconciliation Flow

#### Reconcile Lambda

#### inputs:

```
	{
	 dateRange: {
	  from_date: 2023-01-01, <--- stays the same (for now)
	  to_date: today -2 <--- configurable
	 },
	 program: 'SBC',
	 locations: [1,2,3...]  or []
	}

```

#### steps:

1. Query for all locations.
   - Filter by Program.
   - Filter location_id (if provided, otherwise, all locations)
2. Generate a list of all dates between the from_date and to_date
3. Loop over the locations
4. For each location, loop through the dates
5. For each location on each date, run the POS reconciliation service

### POSReconciliationService

#### inputs:

(For each location, for each date, passed down from the reconcile lambda)

```
{
    location: location_id,
    date: date,
    program: 'SBC' (this is the current default)
}
```

#### steps:

1. Query for all payments. Filter by date, location and status. Order by date, time, amount
2. Query for all POS Deposits. Filter by date, location and status. Order by date, time, amount
3. Loop over all deposits
4. For each deposit, loop through the payments.
5. **Match by:**
   1. Status (PENDING)
   2. Location (implicitly done by querying by location)
   3. Date (implicitly done by querying by date)
   4. Amount
   5. Payment Method
   6. TimeDiff (< 240 s diff)
6. If Match, update the list entry for both Payments and Deposits to a be 'MATCH' in order to not attempt to match this entry again.
7. If Match, assign the corresponding pos_deposit_match to the payment
8. Repeat Steps 3/4/5 (increase time diff to 24 hours)

#### 🛑 Check point:

> after running the method(s) to match pos deposit to payment the list of deposits and the list of payments should be identical in quantity and order to the original list. The specific entries which have been matched should be altered to show a status of MATCH and have the corresponding matched id.

10. Filter out matched for both lists
11. Filter out unmatched for both lists
12. Map through the unmatched lists and change the status to EXCEPTION

#### 🛑 Check point:

> You should now have four lists:
> **payments matched**: - status: MATCH - pos_deposit_match: (uuid for the corresponding deposit)
> **payment exceptions**: - status: EXCEPTION
> **deposits matched** - status: MATCH
> **deposit exceptions** - status: EXCEPTION

13. Call POSDeposit service to update all MATCH status deposits
14. Call POSDeposit service to update all EXCEPTION status deposits
15. Call PaymentService to update all MATCH status payments
16. Call PaymentService to update all EXCEPTION status payments
17. Repeat steps 1-17 for each date and location

## Cash Reconciliation

Reconciliation should run daily for each SBC location. For each location, the cash_deposit table is queried for a list of deposit dates specific to the location, and then for each date on which a deposit has occured, the cash match reconciliation service is called. Cash deposits may have more than one deposit on a single deposit date, but each deposit must have only one corresponding transaction fiscal-close_date. The sum of all cash payments from one fiscal close date for a location is matched to the deposit amount.

### Cash Match Criteria

Payments and deposits match many -> 1 and so the corresponding payments are found by aggregating the sum of payments per fiscal_close_date, per location. They must match on all of the following heuristics. If no match is found the status will update to IN_PROGRESS for both payment and deposit. If not match is found after 2 subsequent deposit dates for the location then the payment status is updated to EXCEPTION. If a deposit does not match to any corresponding payments after 2 subsequent deposit dates then the deposit status is set as EXCEPTION.

1.  Status (PENDING or IN_PROGRESS)
2.  Location (_cash_deposit.pt_location_id ---> payment.transaction.location_id_)
3.  Transaction Date (_cash_depsoit.deposit_date ---> payment.transaction.fiscal_close_date_)
4.  Amount (_cash_deposit.deposit_amt_cdn ---> \_SUM(payment.amount)_)

#### Entities and Relationships

- CashDepositEntity
  - TDI17 (cash/chq/us_funds/etc) deposit
  - cash_deposit table
- TransactionEntity
  - Transaction JSON from SBC sftp server (will come from API in the future)
  - transaction table
  - one transactions -> many payments
- PaymentEntity
  - Payment entry from the payments array of a transaction
  - payment table
  - aggregate of payment rows match to one cash_deposit row
- LocationEntity
  - Lookup table to find corresponding location
  - master_location_data table
  - cash_deposit pt_location_id will match to a corresponding location_id in this table

### Cash Reconciliation Flow

#### Reconcile Lambda

#### inputs:

```
	{
	 dateRange: {
	  from_date: 2023-01-01, <--- stays the same (for now)
	  to_date: today -2 <--- configurable
	 },
	 program: 'SBC',
	 locations: [1,2,3...]  or []
	}

```

#### steps:

1. Query for all locations.
   - Filter by Program.
   - Filter location_id (if provided, otherwise, all locations)
2. Generate a list of all dates between the from_date and to_date
3. Loop over the locations
4. For each location, loop through the dates
5. For each location query the cash_deposit tabel for the list of distinct deposit dates which occured between the event input from_date and to_date

### Cash Reconciliation Service

#### inputs:

(For each location, for each deposit date, passed down from the reconcile lambda)

```
{
    location: Location  Entity,
    date: date,
    program: 'SBC' (this is the current default)
}
```

#### steps:

1. Using the passed in deposit date, find the previous deposit date (or if there is not one then default to the fiscal_start_date)
2. Query for the deposit(s) which match the current deposit date. filter by location/status/program. Order by amount.
3. Query for the payments which are less than or equal to the current deposit date and greater than or equal to the previous deposit_date. Filter by location and status. Order by date/ amount.
4. Aggregate all payments of the same fiscal_close_date
5. Loop over all deposits
6. For each deposit, loop through the aggregated payments.
7. Match the aggregated payment to a deposit 1-1
8. **Match by:**
   1. Status (PENDING or IN_PROGRESS)
   2. Location (implicitly done by querying by location)
   3. Date (payment.transaction.fidcal-close_dtae must be less than or equal to current deposit date)
   4. Amount (sum of payment amount per fiscal close date to the deposit_amt_cdn)
9. If Match, update the list entry for both Payments and Deposits to a be 'MATCH' in order to not attempt to match this entry again.
10. If Match, assign the corresponding cash_deposit_match to the aggregated payment

#### 🛑 Check point:

> after running the method(s) to match cash deposits to payments, the list of deposits and the list of aggregated payments should be identical in quantity and order to the original list. The specific entries which have been matched should be altered to show a status of MATCH and have the corresponding matched id.

10. Filter out matched for both lists
11. Filter out unmatched for both lists
12. Map through the matched list of aggregated payments and change each payment so that the status is MATCH and the cash_match_id is the set as the aggregated payment cash_match_id
13. Map through the unmatched aggregated payments and change each payment so that the status is IN_PROGRESS
14. Map through the unmatched list of deposits and change the status to IN_PROGRESS for each entry

#### 🛑 Check point:

> You should now have four lists:
> **payments matched**: - status: MATCH - pos_deposit_match: (uuid for the corresponding deposit)
> **payment exceptions**: - status: EXCEPTION
> **deposits matched** - status: MATCH
> **deposit exceptions** - status: EXCEPTION

15. Update cash_deposit entities in the DB
16. Update payment entities in the DB
17. After the cash reconciliation service has been called and all payment and deposit entries for the corresponding deposit date have been either matched or set to in progress, call the method to find any exceptions relative to the corresponding deposit date
18. TODO - explain cash exceptions with more detail
19. Repeat steps 1-18 for each date and location
