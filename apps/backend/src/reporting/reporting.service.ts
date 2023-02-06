import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity, TransactionEntity } from '../transaction/entities';
import { ReportConfig } from './interfaces';

export class ReportingService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @InjectRepository(PaymentEntity)
    private paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(TransactionEntity)
    private transactionsRepo: Repository<TransactionEntity>
  ) {}

  async generateReport(config: ReportConfig) {
    this.appLogger.log(config);
    this.appLogger.log('Generating report');
  }

  async reportPosMatchSummaryByDate(): Promise<unknown> {
    const results = await this.posDepositRepo.manager.query(
      `select
      pos.transaction_date,
      pos.count_tdi34_deposits,
      pay.count_pos_payments,
      (pay.count_pos_payments- pos.count_tdi34_deposits) as difference,
      pos_dep_sum,
      pos_pay_sum,
      pos_matched.count_matched_pos,
      ROUND((pos_matched.count_matched_pos::numeric / pay.count_pos_payments::numeric)* 100, 2) as percent_match
    from
      (
      select
        transaction_date,
        count(*) as count_tdi34_deposits,
        sum(transaction_amt) as pos_dep_sum
      from
        pos_deposit pd
      where
        "program" = 'SBC'
      group by
        transaction_date
      order by
        transaction_date asc) as pos
    left join 
    
    (
      select
        t.transaction_date ,
        count(*) as count_pos_payments,
        sum(p.amount) as pos_pay_sum
      from
        payment p
      join "transaction" t on
        t.id = p."transaction"
        and p."method" in ('P', 'V', 'AX', 'M')
      group by
        t.transaction_date
      order by
        t.transaction_date asc) as pay
    
    
    on
      pos.transaction_date = pay.transaction_date
    left join 
    
    (
      select
        t.transaction_date,
        count(*) as count_matched_pos
      from
        payment p
      join "transaction" t on
        t.id = p."transaction"
        and p."method" in ('P', 'V', 'AX', 'M')
          and "match" = true
        group by
          t.transaction_date) as pos_matched
    
    on
      pos.transaction_date = pos_matched.transaction_date`
    );
    return results;
  }

  async reportCashMatchSummaryByDate(): Promise<number> {
    const results = await this.posDepositRepo.manager.query(`
    select
        cash_pay.fiscal_close_date,
        count_cash_payments,
        count_matched_cash,
        (count_cash_payments - count_matched_cash) as difference,
        ROUND((count_matched_cash::numeric / count_cash_payments::numeric)* 100, 2) as percent_match
      from
        (
        select
          t.fiscal_close_date ,
          count(*) as count_cash_payments
        from
          payment p
        join "transaction" t on
          t.id = p."transaction"
          and p."method" not in ('P', 'V', 'AX', 'M')
        group by
          t.fiscal_close_date
        order by
          t.fiscal_close_date asc
      ) as cash_pay
      left join 

      (
        select
          t.fiscal_close_date ,
          count(*) as count_matched_cash
        from
          payment p
        join "transaction" t on
          t.id = p."transaction"
          and p."method" not in ('P', 'V', 'AX', 'M')
            and "match" = true
          group by
            t.fiscal_close_date
      ) as cash_matched

      on
        cash_pay.fiscal_close_date = cash_matched.fiscal_close_date
      order by
        cash_pay.fiscal_close_date`);
    return results;
  }
}
