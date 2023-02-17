import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportConfig } from './interfaces';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities';
export class ReportingService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>
  ) {}

  async generateReport(config: ReportConfig) {
    this.appLogger.log(config);
    this.appLogger.log('Generating report');
  }

  async reportPosMatchSummaryByDate(): Promise<unknown> {
    const results = await this.posDepositRepo.manager.query(`
    SELECT
        pos.transaction_date,
        pos.count_tdi34_deposits,
        pay.count_pos_payments,
        (pay.count_pos_payments- pos.count_tdi34_deposits) 
          AS 
            difference,
        pos_dep_sum,
        pos_pay_sum,
        pos_matched.count_matched_pos,
      ROUND((pos_matched.count_matched_pos::numeric / pay.count_pos_payments::numeric)* 100, 2) 
        AS 
          percent_match
    FROM
    (
      SELECT
        transaction_date,
        COUNT(*) 
          AS 
            count_tdi34_deposits,
        SUM(transaction_amt) 
          AS 
            pos_dep_sum
      FROM
        pos_deposit pd
      WHERE
        "program" = 'SBC'
      GROUP BY
        transaction_date
      ORDER BY
        transaction_date asc) 
        AS 
          pos
      LEFT JOIN(
        SELECT
          t.transaction_date,
          COUNT(*) 
            AS 
              count_pos_payments,
          SUM(p.amount) 
            AS 
              pos_pay_sum
        FROM
          payment p
        JOIN 
          "transaction" t
        ON
          t.transaction_id = p."transaction"
        AND 
          p."method" in ('P', 'V', 'AX', 'M')
        GROUP BY
          t.transaction_date
        ORDER BY
          t.transaction_date asc) as pay

      ON
        pos.transaction_date = pay.transaction_date
      LEFT JOIN(
        SELECT
          t.transaction_date,
          count(*) as count_matched_pos
        FROM
          payment p
        JOIN 
          "transaction" t 
          ON
            t.transaction_id = p."transaction"
          AND 
            p."method" in ('P', 'V', 'AX', 'M')
          AND 
            "status" = 'MATCH'
          GROUP BY
            t.transaction_date
          )
          AS 
            pos_matched
      ON
        pos.transaction_date = pos_matched.transaction_date
  `);
    return results;
  }
  async reportCashMatchSummaryByDate(): Promise<number> {
    const results = await this.posDepositRepo.manager.query(`
      SELECT
      cash_pay.fiscal_close_date,
      count_cash_payments,
      count_matched_cash,
      (count_cash_payments - count_matched_cash) 
        AS 
          difference,
      ROUND((count_matched_cash::numeric / count_cash_payments::numeric)* 100, 2) 
        AS 
          percent_match
      FROM
        (
          SELECT
            t.fiscal_close_date ,
            COUNT(*) 
              AS 
                count_cash_payments
          FROM
            payment p
          JOIN 
            "transaction" t 
          ON
            t.transaction_id = p."transaction"
          AND 
            p."method" 
          NOT IN 
            ('P', 'V', 'AX', 'M')
          AND 
            p.amount > 0
          GROUP BY
            t.fiscal_close_date
          ORDER BY
            t.fiscal_close_date 
              ASC
        ) 
        AS 
          cash_pay
        LEFT JOIN
        (
          SELECT
            t.fiscal_close_date,
            COUNT(*) 
              AS 
                count_matched_cash
          FROM
            payment p
          JOIN "transaction" t 
            ON
              t.transaction_id = p."transaction"
            AND 
              p."method" 
                NOT IN 
                  ('P', 'V', 'AX', 'M')
            AND 
              p."status" = 'MATCH'
          GROUP BY
            t.fiscal_close_date
        ) 
        AS 
          cash_matched
        ON
          cash_pay.fiscal_close_date = cash_matched.fiscal_close_date
        ORDER BY
          cash_pay.fiscal_close_date
    `);
    return results;
  }

  async getCashDepositSummary(
    fiscal_close_date: string,
    fiscal_start_date: string
  ) {
    const results = await this.cashDepositRepo.manager.query(`
      SELECT
        cd.location_id,
        cd.status,
	      COUNT(*)::int,
      FROM
	      cash_deposit cd
      WHERE
	      cd.deposit_date <= '${fiscal_close_date}'::date
	    AND 
        cd.deposit_date > '${fiscal_start_date}'::date
      AND  
        program = 'SBC'
      GROUP BY
	      cd.status,
	      cd.location_id
      ORDER BY 
        location_id, 
        status
    `);
    console.table(results);
    return results;
  }

  async getPaymentSummary(
    fiscal_close_date: string,
    fiscal_start_date: string
  ) {
    //TODO make this more descriptive
    const results = await this.paymentRepo.manager.query(`
      SELECT 
        t.location_id,
        p.status, 
        COUNT(*)::int as count, 
        ROUND(SUM(p.amount), 2)::numeric as payment_amount
      FROM
        payment p
      JOIN 
        transaction t 
      ON
        t.transaction_id = p.transaction
      WHERE
        p.method 
          NOT 
            IN ('AX', 'M', 'V', 'P')
      AND
         t.fiscal_close_date < '${fiscal_close_date}'::date
      AND 
        t.fiscal_close_date > '${fiscal_start_date}'::date
      GROUP BY 
        p.status, 
        t.location_id  
      `);

    console.table(results);
    return results;
  }
}
