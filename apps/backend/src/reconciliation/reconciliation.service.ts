import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { SalesService } from '../sales/sales.service';
import { CashService } from './../cash/cash.service';
import { PosService } from '../pos/pos.service';
import { ILocation } from './../location/interface/location.interface';
import { CashDepositEntity } from './../cash/entities/cash-deposit.entity';
import { LocationService } from './../location/location.service';

//THIS FILE IS WIP
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

  async setPOSMatched(payment: PaymentEntity, deposit: POSDepositEntity) {
    await this.posService.markPOSDepositAsMatched(payment, deposit);
    await this.salesService.markPOSPaymentAsMatched(payment, deposit);
  }

  async updateMatchedPOS(
    pos_deposits: POSDepositEntity[],
    pos_payments: PaymentEntity[]
  ): Promise<unknown> {
    return pos_deposits.map((deposit: POSDepositEntity) =>
      pos_payments.find(
        (payment) =>
          parseFloat(payment.amount) ===
            parseFloat(deposit.transaction_amt.toString()) &&
          this.setPOSMatched(payment, deposit)
      )
    );
  }

  async updateMatchedCash(
    cash_deposits: CashDepositEntity[],
    cash_transactions: PaymentEntity[]
  ): Promise<any | void> {
    const setCashMatched = async (
      payment: PaymentEntity,
      deposit: CashDepositEntity
    ) => {
      await this.salesService.markCashPaymentAsMatched(payment, deposit);
      await this.cashService.markCashDepositAsMatched(payment, deposit);
      console.log('setCashMatched', payment, deposit);
      return { payment, deposit };
    };

    if (cash_deposits.length > cash_transactions.length) {
      return await Promise.all(
        cash_deposits.map((deposit: CashDepositEntity) =>
          cash_transactions.find(
            async (payment: PaymentEntity) =>
              parseFloat(payment.amount) === deposit.deposit_amt_cdn &&
              (await setCashMatched(payment, deposit))
          )
        )
      );
    } else {
      return await Promise.all(
        cash_transactions.map((payment: PaymentEntity) => {
          return cash_deposits.find(
            async (deposit: CashDepositEntity) =>
              deposit.deposit_amt_cdn === parseFloat(payment.amount) &&
              (await setCashMatched(payment, deposit))
          );
        })
      );
    }
  }

  // TODO update return type - move to another file
  public async reconcilePOSBySalesLocation(
    date: string,
    location_id: number,
    match: boolean,
    program: string
  ): Promise<unknown> {
    const pos_payments: PaymentEntity[] =
      await this.salesService.queryPOSTransactions(location_id, date, match);

    const pos_deposits: POSDepositEntity[] =
      await this.posService.queryPOSDeposits(location_id, date, match, program);

    const total_payments_amt = pos_payments.reduce(
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
      total_pos_payments: pos_payments?.length,
      total_pos_deposits: pos_deposits?.length,
      total_payments_amt: `${total_payments_amt}`,
      total_deposit_amt: `${total_deposit_amt}`,
      matched: await this.updateMatchedPOS(pos_deposits, pos_payments)
    };
  }

  // TODO define return type
  async reconcileCash(
    date: string,
    location_id: number,
    program: string
  ): Promise<unknown> {
    const last_deposit_date = await this.cashService.queryLatestCashDeposit(
      location_id
    );

    const deposit_date = last_deposit_date[0].deposit_date ?? date;

    const cash_transactions = await this.salesService.queryCashTransactions(
      location_id,
      deposit_date
    );

    const cash_deposits = await this.cashService.queryCashDeposit(
      program,
      location_id,
      deposit_date
    );
    console.log(cash_deposits, cash_transactions);
    return {
      office: (
        await this.locationService.getLocationByGARMSLocationID(location_id)
      ).office_name,
      deposit_date
      // matched: await this.updateMatchedCash(cash_deposits, cash_transactions),
      // total_cash_payments: cash_transactions.length,
      // total_cash_deposits: cash_deposits.length,
      // total_cash_deposit_amt: cash_deposits.reduce(
      //   (a, b) => a + parseFloat(b.deposit_amt_cdn.toString()),
      //   0
      // )
    };
  }

  async reconcileAllCash(
    date: string,
    match: boolean,
    program: string
  ): Promise<unknown> {
    const locations =
      await this.locationService.getSBCLocationIDsAndOfficeList();
    try {
      if (locations) {
        return await Promise.all(
          locations.map(
            async (location: any) =>
              await this.reconcileCash(date, location.sbc_location, program)
          )
        );
      }
    } catch (err) {
      throw err;
    }
  }

  // TODO define return type
  async reconcileAllPOS(
    date: string,
    match: boolean,
    program: string
  ): Promise<unknown> {
    const locations =
      await this.locationService.getSBCLocationIDsAndOfficeList();
    return (
      locations &&
      (await Promise.all(
        locations.map(
          async (location: any) =>
            await this.reconcilePOSBySalesLocation(
              date,
              location.sbc_location,
              match,
              program
            )
        )
      ))
    );
  }
}
