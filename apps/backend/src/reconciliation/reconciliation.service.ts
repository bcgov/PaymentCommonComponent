import { PaymentEntity } from './../sales/entities/payment.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import { SalesService } from '../sales/sales.service';
import { CashService } from './../cash/cash.service';
import { PosService } from '../pos/pos.service';
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

  async setPOSMatched(payment: any, deposit: any): Promise<any> {
    return {
      deposit: await this.posService.markPOSDepositAsMatched(payment, deposit),
      payment: await this.salesService.markPOSPaymentAsMatched(payment, deposit)
    };
  }

  async printMatchedPOS(
    pos_deposits: POSDepositEntity[],
    pos_payments: PaymentEntity[]
  ): Promise<unknown[]> {
    return pos_deposits.map((deposit: POSDepositEntity) => {
      return {
        payment: pos_payments.find(
          (payment) => payment.amount === deposit.transaction_amt
        ),
        deposit
      };
    });
  }

  public async reconcilePOSBySalesLocation(
    date: string,
    location_id: number
  ): Promise<unknown> {
    const pos_payments: PaymentEntity[] =
      await this.salesService.queryPosPayments(location_id, date);

    const pos_deposits: POSDepositEntity[] =
      await this.posService.queryPOSDeposits(location_id, date);

    const total_payments_amt = pos_payments.reduce(
      (a: any, b: any) => a + parseFloat(b.amount),
      0
    );

    const total_deposit_amt = pos_deposits?.reduce(
      (a: any, b: any) => a + parseFloat(b.transaction_amt),
      0
    );

    const print_matched = await this.printMatchedPOS(
      pos_deposits,
      pos_payments
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
      print_matched,
      set_matched:
        print_matched &&
        (await Promise.all(
          print_matched.map(async (itm: any) => {
            return (
              itm?.deposit &&
              itm?.payment &&
              (await this.setPOSMatched(itm?.payment, itm?.deposit))
            );
          })
        ))
    };
  }

  async setCashMatched(deposit: CashDepositEntity, payment: any): Promise<any> {
    return {
      payment: await this.salesService.markCashPaymentAsMatched(
        payment,
        deposit
      ),
      deposit: await this.cashService.markCashDepositAsMatched(payment, deposit)
    };
  }

  async reconcileCash(
    date: string,
    location_id: number,
    program: string
  ): Promise<unknown> {
    const last_deposit_date = await this.cashService.queryLatestCashDeposit(
      location_id
    );

    const deposit_date = last_deposit_date[0]?.deposit_date ?? date;

    const cash_transactions = await this.salesService.queryCashTransactions(
      location_id,
      deposit_date
    );

    const cash_deposits = await this.cashService.queryCashDeposit(
      program,
      location_id,
      deposit_date
    );

    const matched =
      cash_deposits.length > 0 &&
      cash_transactions.length > 0 &&
      cash_transactions.map((payment: any) => {
        return {
          deposit: cash_deposits.find(
            (deposit: any) => deposit.deposit_amt_cdn === payment.sum
          ),
          payment
        };
      });

    return {
      office: (
        await this.locationService.getLocationByGARMSLocationID(location_id)
      ).office_name,
      deposit_date,
      matched,
      set_matched:
        matched &&
        (await Promise.all(
          matched.map(async (itm: any) => {
            return (
              itm?.deposit &&
              itm?.payment &&
              (await this.setCashMatched(itm?.deposit, itm?.payment))
            );
          })
        )),
      total_cash_payments: cash_transactions.length,
      total_cash_deposits: cash_deposits.length
    };
  }

  async reconcileAllCash(date: string, program: string): Promise<unknown> {
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
  async reconcileAllPOS(date: string): Promise<unknown> {
    const locations =
      await this.locationService.getSBCLocationIDsAndOfficeList();
    return (
      locations &&
      (await Promise.all(
        locations.map(
          async (location: any) =>
            await this.reconcilePOSBySalesLocation(date, location.sbc_location)
        )
      ))
    );
  }
}
