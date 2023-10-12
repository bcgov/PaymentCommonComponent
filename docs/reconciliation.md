# Reconciliation

---

## Introduction

The goal is to simplify and automate the process that compares two set of records (TDI files to Sales) to verify that financial figures are correct and in agreement. Reconciliation is used to prevent balance sheet errors on financial accounts, check for fraud, and to reconcile the general ledger.

## Table of Contents

1. [POS Reconciliation](#pos-reconciliation)
1. [Cash Reconciliation](#cash-reconciliation)

# POS Reconciliation

## Overview

The `PosReconciliationService` handles the reconciliation of POS (Point of Sale) payments with POS deposits. It provides methods to match payments with deposits based on location, program, date, and time using heuristics. 

## Usage

### 1. Configuration

Service can be set to use the appropriate heuristics for your ministry. This is done using the `setHeuristics` method.

```typescript
service.setHeuristics(ministry: Ministries): void;
```

- `ministry`: The ministry for which heuristics need to be set, represented by an enum value (e.g., `Ministries.SBC`). This determines the matching rules.

### 2. Reconciliation

To perform reconciliation, you can call the `reconcile` method. This method matches pending payments with pending deposits based on the configured heuristics.

```typescript
async reconcile(
  location: LocationEntity,
  pendingPayments: PaymentEntity[],
  pendingDeposits: POSDepositEntity[],
  currentDate: Date
): Promise<unknown>;
```

- `location`: The location for which reconciliation is being performed, represented as a `LocationEntity` object.

- `pendingPayments`: An array of pending payment entities (e.g., `PaymentEntity[]`) that need to be matched with deposits.

- `pendingDeposits`: An array of pending deposit entities (e.g., `POSDepositEntity[]`) that need to be matched with payments.

- `currentDate`: The current date used for updating the progress of matching operations.

### 3. Match Results

The `reconcile` method returns a promise that resolves to an object containing information about the reconciliation process. Here are some of the key properties in the result:

- `type`: The type of reconciliation (e.g., `ReconciliationType.POS`).

- `location_id`: The ID of the location for which reconciliation was performed.

- `total_deposits_pending`: The total number of pending deposits.

- `total_payments_pending`: The total number of pending payments.

- `total_matched_payments`: The total number of payments that were successfully matched.

- `total_matched_deposits`: The total number of deposits that were successfully matched.

- `total_payments_in_progress`: The total number of payments currently in progress.

- `total_deposits_in_progress`: The total number of deposits currently in progress.

- `total_payments_updated`: The total number of payments updated, including matched and in-progress payments.

- `total_deposits_updated`: The total number of deposits updated, including matched and in-progress deposits.

## Methods

### `matchRound`

This method is used internally for performing recursive matching rounds.

```typescript
matchRound(
  payments: PaymentEntity[],
  deposits: POSDepositEntity[],
  round: PosHeuristicRound,
  allMatchedPayments: PaymentEntity[],
  allMatchedDeposits: POSDepositEntity[]
): MatchResults;
```

- `payments`: An array of payment entities to be matched in the current round.

- `deposits`: An array of deposit entities to be matched in the current round.

- `round`: The current heuristic matching round.

- `allMatchedPayments`: An array containing all matched payment entities from previous rounds.

- `allMatchedDeposits`: An array containing all matched deposit entities from previous rounds.

### `findMatchesInDictionary`

This method finds matches in dictionaries based on the configured heuristics.

```typescript
findMatchesInDictionary(
  methodAndDateDictionaries: Dictionary[],
  round: Heuristics
): MatchResults;
```

- `methodAndDateDictionaries`: An array of dictionaries containing payment and deposit information.

- `round`: The current heuristic matching round.

### `buildDictionaries`

This method builds dictionaries of payments and deposits based on the current round.

```typescript
buildDictionaries(
  payments: PaymentEntity[],
  deposits: POSDepositEntity[],
  round: PosHeuristicRound
): Dictionary[];
```

- `payments`: An array of payment entities.

- `deposits`: An array of deposit entities.

- `round`: The current heuristic matching round.

### `paymentDictionary`

This method creates a dictionary of payment entities.

```typescript
paymentDictionary(payments: PaymentEntity[]): Dictionary;
```

- `payments`: An array of payment entities to be included in the dictionary.

### `depositDictionary`

This method creates a dictionary of deposit entities.

```typescript
depositDictionary(
  deposits: POSDepositEntity[],
  round: PosHeuristicRound
): Dictionary;
```

- `deposits`: An array of deposit entities to be included in the dictionary.

- `round`: The current heuristic matching round.

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