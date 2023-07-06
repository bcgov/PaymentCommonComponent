export const dailySummaryColumns = [
  { header: 'Program', key: 'program' },
  { header: 'Dates', key: 'dates' },
  { header: 'Location ID', key: 'location_id' },
  { header: 'Location', key: 'location_name' },
  { header: 'Total Payments', key: 'total_payments' },
  { header: 'Total Unmatched Payments', key: 'total_unmatched_payments' },
  { header: '% Unmatched Payments', key: 'percent_unmatched_payments' },
  { header: 'Sum Of Payments', key: 'total_payment_sum' },
  { header: 'Total Deposits', key: 'total_deposits' },
  { header: 'Total Unmatched Deposits', key: 'total_unmatched_deposits' },
  { header: '% Unmatched Deposits', key: 'percent_unmatched_deposits' },
  { header: 'Sum Of Deposits', key: 'total_deposit_sum' },
];

export const detailedReportColumns = [
  { header: 'Source File', key: 'source_file' },
  { header: 'Transaction ID', key: 'transaction_id' },
  { header: 'Location ID', key: 'location_id' },
  { header: 'Location', key: 'location' },
  { header: 'Type', key: 'type' },
  { header: 'Status', key: 'reconciliation_status' },
  { header: 'Amount', key: 'amount' },
  { header: 'Payment Method', key: 'payment_method' },
  {
    header: 'Transaction: Paid On',
    key: 'txn_date',
  },
  { header: 'Time', key: 'time' },
  {
    header: 'Transaction: Deposited On/Closed On',
    key: 'close_date',
  },
  {
    header: 'Status: Uploaded On',
    key: 'uploaded_date',
  },
  {
    header: 'Status: In Progress On',
    key: 'in_progress_date',
  },
  {
    header: 'Status: Reconciled On',
    key: 'reconciled_date',
  },
  { header: 'Heuristic Match Round', key: 'heuristic_match_round' },
  { header: 'Foreign Currency Amount', key: 'foreign_currency_amount' },
  { header: 'Currency', key: 'currency' },
  { header: 'Exchange Rate', key: 'exchange_rate' },
  { header: 'UUID', key: 'uuid', hidden: true },
  { header: 'Match ID', key: 'match_id', hidden: true },
  { header: 'Misc', key: 'misc' },
  { header: 'Employee ID', key: 'employee_id' },
  { header: 'Merchant ID', key: 'merchant_id' },
  { header: 'Terminal No', key: 'terminal_no' },
  { header: 'Card ID', key: 'card_id' },
  { header: 'Transaction Code', key: 'transaction_code' },
  { header: 'Approval Code', key: 'approval_code' },
  { header: 'Invoice no', key: 'invoice_no' },
  { header: 'Echo Data Field', key: 'echo_data_field' },
  { header: 'Dist Client Code', key: 'dist_client_code' },
  { header: 'Dist Resp Code', key: 'dist_resp_code' },
  { header: 'Dist Service Line Code', key: 'dist_service_line_code' },
  { header: 'Dist Stob Code', key: 'dist_stob_code' },
  { header: 'Dist Project Code', key: 'dist_project_code' },
  { header: 'Dist Location Code', key: 'dist_location_code' },
  { header: 'Dist Future Code', key: 'dist_future_code' },
];
export enum Report {
  DAILY_SUMMARY = 'Daily Summary',
  DETAILED_REPORT = 'Reconciliation Details',
  CAS_REPORT = 'CAS Comparison',
}

export const casReportColumns = [
  { header: 'Location ID', key: 'location_id' },
  { header: 'Loction Name', key: 'loction_name' },
  { header: 'Settlement Date', key: 'settlement_date' },
  { header: 'Daily Sum', key: 'card_vendor' },
  { header: 'Amount', key: 'amount' },
  { header: 'Dist Client Code', key: 'dist_client_code' },
  { header: 'Dist Resp Code', key: 'dist_resp_code' },
  { header: 'Dist Stob Code', key: 'dist_stob_code' },
  { header: 'Dist Service Line Code', key: 'dist_service_line_code' },
  { header: 'Dist Project Code', key: 'dist_project_code' },
];
