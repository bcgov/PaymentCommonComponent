import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import { TransactionEntity } from '../sales/entities/transaction.entity';
import { CashDepositEntity } from '../cash/entities/cash-deposit.entity';
import { PaymentMethodEntity } from '../sales/entities/payment-method.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { ILocation } from './interface';
import { SalesService } from '../sales/sales.service';
import { CashService } from './../cash/cash.service';
import { PosService } from '../pos/pos.service';

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @InjectRepository(TransactionEntity)
    private transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepo: Repository<PaymentMethodEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(SalesService)
    private salesService: SalesService,
    @Inject(PosService)
    private posService: PosService,
    @Inject(CashService)
    private cashService: CashService
  ) {}

  //TODO this is temporary for testing the parsed garms json only
  async readAndParseGarms(filename: string, filebuffer: Buffer) {
    try {
      return parseGarms(JSON.parse(filebuffer.toString()));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  async readAndParseFile(
    type: string,
    program: string,
    fileName: string,
    data: Buffer
  ): Promise<any> {
    try {
      return parseTDI(type, data.toString(), fileName, program);
    } catch (err) {
      this.appLogger.error(err, 'Error parsing file');
      throw err;
    }
  }

  public async getMerchantIds(location_id: number): Promise<number[]> {
    const merchant_ids = await this.transactionRepo.manager.query(`
        SELECT DISTINCT "Merchant ID" 
        FROM public.master_location_data ml 
        WHERE ml."GARMS Location" = ${location_id} 
        AND "Type" != 'Bank'
      `);
    return merchant_ids.map((itm: any) => parseInt(itm['Merchant ID']));
  }

  public async getPTIDs(location_id: number): Promise<string[]> {
    const pt_ids = await this.transactionRepo.manager.query(`
          SELECT DISTINCT "Location" 
          FROM public.master_location_data ml 
          WHERE ml."GARMS Location" = ${location_id}
        `);
    return pt_ids.map((itm: any) => itm['Location']);
  }

  public async getLocationList(): Promise<ILocation[]> {
    const locations = await this.transactionRepo.manager.query(`
        SELECT "GARMS Location", description 
        FROM public.master_location_data ml 
        WHERE ml."Type" = 'Bank' 
        ORDER BY "GARMS Location" DESC;
      `);
    return locations.map((itm: any) => ({
      sbc_location: itm['GARMS Location'],
      office_name: itm.description
    }));
  }

  public async getMethod(sbc_code: number) {
    const payment_method = await this.paymentMethodRepo.findOne({
      where: { sbc_code }
    });
    if (payment_method) {
      return payment_method.sbc_code;
    }
  }

  public async reconcilePOS(date: string, location_id: number) {
    const locations = await this.getLocationList();

    const location = locations.find(
      (itm: any) => itm.sbc_location === location_id
    );

    const pos_transactions =
      location &&
      (await this.salesService.queryPOSTransactions(
        location?.sbc_location,
        date
      ));

    const pos_deposits =
      location &&
      (await this.posService.queryPOSDeposits(
        await this.getMerchantIds(location?.sbc_location),
        date
      ));

    const total_transactions_amt = pos_transactions?.reduce(
      (a: any, b: any) => a + parseFloat(b.amount),
      0
    );

    const total_deposit_amt = pos_deposits?.reduce(
      (a: any, b: any) => a + parseFloat(b.transaction_amt),
      0
    );

    return {
      date,
      office: location?.office_name,
      total_pos_payments: pos_transactions?.length,
      total_pos_deposits: pos_deposits?.length,
      total_transactions_amt: `${total_transactions_amt}`,
      total_deposit_amt: `${total_deposit_amt}`
    };
  }

  async reconcileCash(date: string, location_id: number) {
    const locations = await this.getLocationList();

    const location = locations.find(
      (itm: any) => itm.sbc_location === location_id
    );

    const cash_dates = await this.cashService.queryCashDepositRange(
      location_id
    );

    const cash_transactions = await this.salesService.queryCashTransactions(
      location_id,
      cash_dates
    );

    const cash_deposits = await this.cashService.queryCashDeposit(location_id);

    const total_cash_amt = cash_transactions.reduce(
      (a: any, b: any) => a + parseFloat(b.amount),
      0
    );

    const total_cash_deposit_amt = cash_deposits.reduce(
      (a: any, b: any) => a + parseFloat(b.deposit_amt_cdn),
      0
    );

    return {
      office: location?.office_name,
      deposit_date: cash_dates.current_deposit_date,
      date_range:
        cash_dates.last_deposit_date + '-' + cash_dates.current_deposit_date,
      total_cash_amt,
      total_cash_deposit_amt,
      total_cash_payments: cash_transactions.length,
      total_cash_deposits: cash_deposits.length
    };
  }

  async reconcileAllCash(date: string) {
    const locations = await this.getLocationList();

    return await Promise.all(
      locations.map(
        async (itm) => await this.reconcileCash(date, itm.sbc_location)
      )
    );
  }

  async reconcileAllPOS(date: string) {
    const locations = await this.getLocationList();

    return await Promise.all(
      locations.map(
        async (itm) => await this.reconcilePOS(date, itm.sbc_location)
      )
    );
  }
}
