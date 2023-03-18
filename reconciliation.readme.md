**Overview:**

Reconciliation occurs daily for each SBC location. On each run it will check all dates for all locations starting from the “fiscal_start_period”, currently 01-01-2023, up to the current date. It will only attempt to match “pending” and “in progress” payments and deposits. If there are no such payments, the system will skip that day.

**POS Criteria:**

Payments and deposits must match 1-1 and must match on all of the following heuristics. If no match is found an exception is thrown.

- status: pending
- location
- transaction date
- payment method -> card_vendor
- amount -> transaction amount
- program/ministry
- transaction time must be not be more than 240 seconds apart

**Cash Criteria:**

The system retrieves the most recent four cash deposits for a specified location and date. (Going back from the specified date). All payments and deposits which are in pending are marked as in progress. For a given cash deposit date for a given location, the payments which occured less than or on the current deposit date, dating back to three deposit dates prior will be matched. The payments are grouped by the fiscal_close_date and the sum of the payment amount for a given fiscal close date is matched against a single cash deposit date. The cash deposit id is recorded and cannot be matched against again.

- status: in progress
- location
- fiscal_close_date < deposit_date (specific to the location)
- fiscal_close_date > the third previous deposit date (specific to the location)
- an exception is thrown if any dates are older than the third previous deposit date
- all matched (aggregated) cash payments must be from a single fiscal_close_date
- the amount must match 1-1 with a single cash deposit
