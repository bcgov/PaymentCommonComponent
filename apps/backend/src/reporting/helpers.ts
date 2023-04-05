import { format } from 'date-fns';
import { DetailsReport } from './interfaces';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { PaymentEntity } from '../transaction/entities/payment.entity';

export const parseCashDepositDetailsForReport = (
  location: LocationEntity,
  deposit: CashDepositEntity,
  dates?: string[]
) =>
  ({
    source_file: 'Cash/Chq (TDI 17)',
    reconciliation_status: deposit.status,
    transaction_id: deposit.jv_no ?? '',
    location_id: location.location_id,
    location: location.description,
    date: deposit.deposit_date,
    time: deposit.deposit_time ?? '',
    deposit_date_range:
      dates && dates[0] && dates[1] ? `${dates[1]}-${dates[0]}` : '',
    fiscal_date: deposit.deposit_date,
    payment_method: 'CASH/CHQ',
    amount: deposit.deposit_amt_cdn,
    foreign_currency_amount:
      deposit.deposit_amt_curr != deposit.deposit_amt_cdn
        ? deposit.deposit_amt_curr
        : null,
    currency: deposit.currency ?? 'CAD',
    exchange_rate: deposit.exchange_adj_amt ?? null,
    misc: '',
    merchant_id: null,
    terminal_no: '',
    card_id: '',
    transaction_code: null,
    approval_code: '',
    invoice_no: '',
    echo_data_field: '',
    dist_client_code: null,
    dist_resp_code: location.resp_code,
    dist_service_line_code: location.service_line_code,
    dist_stob_code: location.stob_code,
    dist_project_code: location.project_code,
    dist_location_code: location.location_id,
    dist_future_code: null
  } as DetailsReport);

export const parsePosDepositDetailsForReport = (
  location: LocationEntity,
  deposit: POSDepositEntity
) =>
  ({
    source_file: 'POS (TDI 34)',
    reconciliation_status: deposit.status,
    transaction_id: '',
    location_id: location.location_id,
    location: location.description,
    date: deposit.transaction_date,
    time: deposit.transaction_time,
    deposit_date_range: '',
    fiscal_date: format(new Date(deposit.settlement_date), 'yyyy-MM-dd'),
    payment_method: deposit.payment_method.description,
    amount: deposit.transaction_amt,
    foreign_currency_amount: null,
    currency: 'CAD',
    exchange_rate: null,
    misc: '',
    merchant_id: deposit.merchant_id,
    terminal_no: deposit.terminal_no,
    card_id: deposit.card_id,
    transaction_code: deposit.transaction_code,
    approval_code: '',
    invoice_no: '',
    echo_data_field: '',
    dist_client_code: null,
    dist_resp_code: location.resp_code,
    dist_service_line_code: location.service_line_code,
    dist_stob_code: location.stob_code,
    dist_project_code: location.project_code,
    dist_location_code: location.location_id,
    dist_future_code: null
  } as DetailsReport);

/*eslint-disable */
export const parsePaymentDetailsForReport = (
  location: LocationEntity,
  payment: PaymentEntity,
  dates?: string[]
) =>
  ({
    source_file: 'Transaction (LOB)',
    reconciliation_status: payment.status,
    transaction_id: payment.transaction.transaction_id,
    location_id: location.location_id,
    location: location.description,
    date: payment.transaction.transaction_date,
    time: payment.transaction.transaction_time ?? '',
    deposit_date_range:
      dates && dates[0] && dates[1] ? `${dates[1]}-${dates[0]}` : '',
    fiscal_date: payment.transaction.fiscal_close_date,
    payment_method: payment.payment_method.description,
    amount: payment.amount,
    foreign_currency_amount: payment.foreign_currency_amount ?? null,
    currency: payment.currency ?? 'CAD',
    exchange_rate: payment?.exchange_rate ?? null,
    misc: '',
    merchant_id: null,
    terminal_no: '',
    card_id: '',
    transaction_code: null,
    approval_code: '',
    invoice_no: '',
    echo_data_field: '',
    dist_client_code: null,
    dist_resp_code: location.resp_code,
    dist_service_line_code: location.service_line_code,
    dist_stob_code: location.stob_code,
    dist_project_code: location.project_code,
    dist_location_code: location.location_id,
    dist_future_code: null
  } as DetailsReport);
