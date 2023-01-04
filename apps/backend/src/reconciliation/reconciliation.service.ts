import { POSDepositEntity } from './entities/pos-deposit.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposits';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(TransactionEntity)
    private salesRepo: Repository<TransactionEntity>,
    @InjectRepository(POSDepositEntity)
    private TDI34: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private TDI17: Repository<CashDepositEntity>
  ) {}

  //TODO ADD DTO AND RETURN TYPE
  async addSales(body: any[]) {
    return body.forEach(async (itm: any) => {
      await this.salesRepo.save(this.salesRepo.create(itm));
    });
  }

  //TODO ADD DTO
  async addTDI34(body: any) {
    body.details.forEach(async (itm: any) => {
      return await this.TDI34.save(
        this.TDI34.create({
          // location: location ? location : undefined,
          merchant_terminal: itm.merchant_terminal,
          terminal_no: itm.terminal_no,
          // payment_method: payment_method ? payment_method : undefined,
          card_vendor: itm.card_vendor,
          card_id: itm.card_id,
          transaction_date: itm.transaction_date,
          transaction_time: itm.transaction_time,
          settlement_date: itm.settlement_date,
          transaction_cd: itm.transaction_cd,
          transaction_amt: itm.transaction_amt
        })
      );
    });
  }

  //TODO ADD DTO AND RETURN TYPE
  async addTDI17(body: any) {
    body.details.forEach(async (itm: any) => {
      return await this.TDI17.save(
        this.TDI17.create({
          program_cd: itm.program_cd,
          deposit_date: itm.deposit_date,
          transaction_type: itm.transaction_type,
          location_id: itm.location_id,
          deposit_time: itm.deposit_time,
          seq_no: itm.seq_no,
          location_desc: itm.location_desc,
          deposit_amt_curr: itm.deposit_amt_curr,
          currency: itm.currency,
          exchange_adj_amt: itm.exchange_adj_amt,
          deposit_amt_cdn: itm.deposit_amt_cdn,
          destination_bank_no: itm.destination_bank_no,
          batch_no: itm.batch_no,
          jv_type: itm.jv_type,
          jv_no: itm.jv_no
        })
      );
    });
  }

  addData(type: string, data: any) {
    switch (type) {
      case 'TDI17':
        return this.addTDI17(data);
      case 'TDI34':
        return this.addTDI34(data);
      case 'SALES':
        return this.addSales(data);
      default:
        return;
    }
  }
}
