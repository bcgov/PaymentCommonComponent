import { LocationService } from './../location/location.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import { TransactionEntity } from '../sales/entities/transaction.entity';
import { CashDepositEntity } from '../cash/entities/cash-deposit.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { SalesService } from '../sales/sales.service';
import { CashService } from './../cash/cash.service';
import { PosService } from '../pos/pos.service';

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(SalesService)
    private salesService: SalesService,
    @Inject(PosService)
    private posService: PosService,
    @Inject(CashService)
    private cashService: CashService,
    @Inject(LocationService)
    private locationService: LocationService
  ) {}

  // TODO define return type
  public async reconcilePOS(date: string, location_id: number): Promise<any> {
    const pos_transactions: PaymentEntity[] =
      await this.salesService.queryPOSTransactions(location_id, date);

    const pos_deposits: POSDepositEntity[] =
      await this.posService.queryPOSDeposits(location_id, date);

    const total_transactions_amt = pos_transactions.reduce(
      (a: any, b: any) => a + parseFloat(b.amount),
      0
    );

    const total_deposit_amt = pos_deposits?.reduce(
      (a: any, b: any) => a + parseFloat(b.transaction_amt),
      0
    );

    return {
      date,
      office: await this.locationService.getLocationByGARMSLocationID(
        location_id
      ),
      total_pos_payments: pos_transactions?.length,
      total_pos_deposits: pos_deposits?.length,
      total_transactions_amt: `${total_transactions_amt}`,
      total_deposit_amt: `${total_deposit_amt}`
    };
  }

  // TODO define return type
  async reconcileCash(date: string, location_id: number): Promise<any> {
    const cash_dates: {
      current_deposit_date: string;
      last_deposit_date: string;
    } = await this.cashService.queryCashDepositRange(location_id);

    const deposit_date = cash_dates.current_deposit_date;
    const date_range = `${cash_dates.last_deposit_date} - ${deposit_date}`;

    const cash_transactions: TransactionEntity[] =
      await this.salesService.queryCashTransactions(
        location_id,
        cash_dates,
        date
      );

    const cash_deposits: CashDepositEntity[] =
      await this.cashService.queryCashDeposit(
        location_id,
        cash_dates.current_deposit_date,
        date
      );

    const total_cash_amt = cash_transactions.reduce(
      (a: number, b: any) => a + parseFloat(b.amount),
      0
    );

    const total_cash_deposit_amt = cash_deposits.reduce(
      (a: any, b: any) => a + parseFloat(b.deposit_amt_cdn),
      0
    );

    return {
      office: await this.locationService.getLocationByGARMSLocationID(
        location_id
      ),
      deposit_date,
      date_range,
      total_cash_amt,
      total_cash_deposit_amt,
      total_cash_payments: cash_transactions.length,
      total_cash_deposits: cash_deposits.length
    };
  }

  // TODO define return type
  async reconcileAllCash(date: string): Promise<any> {
    const locations = await this.locationService.getLocationList();
    try {
      if (locations) {
        return await Promise.all(
          locations.map(
            async (location: any) =>
              await this.reconcileCash(date, location.sbc_location)
          )
        );
      }
    } catch (err) {
      throw err;
    }
  }

  // TODO define return type
  async reconcileAllPOS(date: string): Promise<any> {
    const locations = await this.locationService.getLocationList();
    try {
      if (locations) {
        return await Promise.all(
          locations.map(
            async (location: any) =>
              await this.reconcilePOS(date, location.sbc_location)
          )
        );
      }
    } catch (err) {
      throw err;
    }
  }
}
