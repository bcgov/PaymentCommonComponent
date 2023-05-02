export const garmsKeys = [
  'sales_transaction_id',
  'sales_transaction_date',
  'fiscal_close_date',
  'payment_total',
  'void_indicator',
  'transaction_reference',
  { payments: ['amount', 'currency', 'exchange_rate', 'method'] },
  { misc: 'employee_id' },
  {
    distributions: [
      'line_number',
      'dist_client_code',
      'dist_resp_code',
      'dist_service_line_code',
      'dist_stob_code',
      'dist_project_code',
      'dist_location_code',
      'dist_future_code',
      'line_dollar_amount',
      'line_description',
      'supplier_code',
      'revenue_gl_account'
    ]
  },
  {
    source: [
      'source_id',
      'location_id',
      {
        revenue_gl_accounts: [
          'dist_client_code',
          'dist_resp_code',
          'dist_service_line_code',
          'dist_stob_code',
          'dist_project_code',
          'dist_location_code',
          'dist_future_code',
          'supplier_code'
        ]
      }
    ]
  }
];
