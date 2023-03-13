import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import format from 'date-fns/format';
import { Repository } from 'typeorm';
import { dailySummaryColumns } from './const';
import { DailySummary, ReportConfig } from './interfaces';
import { dailySummarySheetHeaderStyle, rowStyle } from './styles';
import { Ministries } from '../constants';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { ExcelExportService } from '../excelexport/excelexport.service';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from '../transaction/payment.service';
import { MatchStatus } from './../common/const';

export class ReportingService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @Inject(LocationService)
    private locationService: LocationService,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>,
    @Inject(PaymentService)
    private paymentService: PaymentService,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(ExcelExportService)
    private excelWorkbook: ExcelExportService
  ) {}

  async generateReport(config: ReportConfig) {
    this.appLogger.log(config);
    this.appLogger.log('Generating report');
    await this.excelWorkbook.saveS3('test');
  }

  async generateDailySummary(config: ReportConfig) {
    this.appLogger.log(config);
    this.appLogger.log('Generating Daily Summary Report');

    const locations = await this.locationService.getLocationsBySource(
      config.program
    );

    const dailySummaryReport = await Promise.all(
      locations.map(
        async (location: LocationEntity) =>
          await this.dailyReportPaymentInfo(
            format(new Date(config.period.from), 'yyyy-MM-dd'),
            location,
            config.program
          )
      )
    );

    this.excelWorkbook.generateWorkbook('Reconciliation Report');
    this.excelWorkbook.addSheet('Daily Summary');
    this.excelWorkbook.addColumns(
      'Daily Summary',
      dailySummaryColumns,
      dailySummarySheetHeaderStyle
    );
    this.excelWorkbook.addRows('Daily Summary', dailySummaryReport);
    await this.excelWorkbook.saveLocal();
    await this.excelWorkbook.saveS3('Reconciliation Report');
  }

  async dailyReportPaymentInfo(
    date: string,
    location: LocationEntity,
    program: Ministries
  ): Promise<DailySummary> {
    const payments = await this.paymentService.findWithPartialSelect(
      location,
      date
    );
    const exceptions = payments.filter(
      (itm: PaymentEntity) => itm.status === 'EXCEPTION'
    ).length;

    const inProgress = payments.filter(
      (itm: PaymentEntity) => itm.status === 'IN_PROGRESS'
    ).length;

    const matched = payments.filter(
      (itm: PaymentEntity) => itm.status === 'MATCH'
    ).length;

    const total = payments.length;

    const unmatchedPercentage =
      total != 0 ? parseFloat(((exceptions / total) * 100).toFixed(2)) : 0;

    const totalSum = payments.reduce((acc, itm) => (acc += itm.amount), 0);

    const rowStatus =
      exceptions > 0
        ? MatchStatus.EXCEPTION
        : inProgress > 0
        ? MatchStatus.IN_PROGRESS
        : matched > 0
        ? MatchStatus.MATCH
        : MatchStatus.PENDING;

    return {
      values: {
        program,
        date,
        location_id: location.location_id,
        location_name: location.description,
        total_payments: total,
        total_unmatched_payments: exceptions,
        percent_unmatched: unmatchedPercentage,
        total_sum: parseFloat(totalSum.toFixed(2))
      },
      status: rowStatus,
      style: rowStyle(rowStatus)
    };
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
    const results = await this.paymentRepo.manager.query(`
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
            t.fiscal_close_date,
            COUNT(*) 
              AS 
                count_cash_payments
          FROM
            payment p
          JOIN 
            "transaction" t 
          ON
            t.transaction_id = p."transaction"
          WHERE
            p."method" 
          NOT IN 
            ('P', 'V', 'AX', 'M')

              
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
          WHERE 
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

  async cashReportByLocation(location_id: number): Promise<unknown[]> {
    return await this.paymentRepo.manager.query(`
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
          t.fiscal_close_date,
          COUNT(*) 
            AS 
              count_cash_payments
        FROM
          payment p
        JOIN 
          "transaction" t 
        ON
          t.transaction_id = p."transaction"
        WHERE
          p."method" 
        NOT IN 
          ('P', 'V', 'AX', 'M')

        AND t."location_id" = ${location_id}          
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
        WHERE 
            p."method" 
              NOT IN 
                ('P', 'V', 'AX', 'M')
          AND 
            p."status" = 'MATCH'
            AND t."location_id" = ${location_id}
        GROUP BY
          t.fiscal_close_date
          ORDER BY
          t.fiscal_close_date 
            DESC
      ) 
      AS 
        cash_matched
      ON
        cash_pay.fiscal_close_date = cash_matched.fiscal_close_date
      ORDER BY
        cash_pay.fiscal_close_date ASC
  `);
  }
}
