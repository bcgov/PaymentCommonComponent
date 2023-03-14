import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import format from 'date-fns/format';
import { Repository } from 'typeorm';
import { dailySummaryColumns, detailedReportColumns } from './const';
import {
  parseCashDepositDetailsForReport,
  parsePaymentDetailsForReport,
  parsePosDepositDetailsForReport
} from './helpers';
import { DetailsReport, DailySummary, ReportConfig } from './interfaces';
import { columnStyle, rowStyle, headerStyle, headerPlacement } from './styles';
import { MatchStatus } from '../common/const';
import { Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { ExcelExportService } from '../excelexport/excelexport.service';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { ReconciliationEvent } from '../reconciliation/types';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from '../transaction/payment.service';

export class ReportingService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @Inject(LocationService)
    private locationService: LocationService,
    @Inject(PaymentService)
    private paymentService: PaymentService,
    @Inject(CashDepositService)
    private cashDepositService: CashDepositService,
    @Inject(PosDepositService)
    private posDepositService: PosDepositService,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(ExcelExportService)
    private excelWorkbook: ExcelExportService
  ) {}

  async generateReport(config: ReportConfig): Promise<void> {
    this.appLogger.log(config);

    const locations = await Promise.all(
      await this.locationService.getLocationsBySource(config.program)
    );
    this.appLogger.log(
      `Generating Reconciliation Report For ${locations.length} locations`,
      ReportingService
    );

    this.excelWorkbook.addWorkbookMetadata('Reconciliation Report');

    await this.generateDailySummary(config, locations);
    await this.generateDetailsWorksheet(config, locations);
    await this.excelWorkbook.saveLocal();
    await this.excelWorkbook.saveS3('reconciliation_report');
  }

  async generateDetailsWorksheet(
    config: ReportConfig,
    locations: LocationEntity[]
  ): Promise<void> {
    this.appLogger.log(config);
    this.appLogger.log('Generating Reconciliation Details Worksheet');

    const details: DetailsReport[] = [];

    await Promise.all(
      locations.map(async (itm) => {
        const values = await this.findAndParseDataForDetailedReport(
          config,
          itm
        );
        details.push(...values);
      })
    );

    const rowStartIndex = 4;
    const colStartIndex = 3;

    this.excelWorkbook.addSheet('Reconciliation Details');

    this.excelWorkbook.addColumns(
      'Reconciliation Details',
      detailedReportColumns
    );

    this.excelWorkbook.addRows(
      'Reconciliation Details',
      details.map((itm) => ({ values: itm, style: {} })),
      rowStartIndex
    );

    this.excelWorkbook.addTitleRow(
      'Reconciliation Details',
      headerStyle,
      headerPlacement
    );
    /* set column-headers style */
    this.excelWorkbook.addRowStyle(
      'Reconciliation Details',
      colStartIndex,
      columnStyle
    );
  }

  async generateDailySummary(
    config: ReportConfig,
    locations: LocationEntity[]
  ): Promise<void> {
    this.appLogger.log(config);
    this.appLogger.log(
      'Generating Daily Summary WorkSheet',
      ReportingService.name
    );

    const dailySummaryReport = await Promise.all(
      locations.map(
        async (location: LocationEntity) =>
          await this.findPaymentDataForDailySummary(
            format(new Date(config.period.to), 'yyyy-MM-dd'),
            location,
            config.program
          )
      )
    );

    const rowStartIndex = 4;
    const colStartIndex = 3;

    this.excelWorkbook.addSheet('Daily Summary');
    this.excelWorkbook.addColumns('Daily Summary', dailySummaryColumns);
    this.excelWorkbook.addRows(
      'Daily Summary',
      dailySummaryReport,
      rowStartIndex
    );
    this.excelWorkbook.addTitleRow(
      'Daily Summary',
      headerStyle,
      headerPlacement
    );
    /* set column-headers style */
    this.excelWorkbook.addRowStyle('Daily Summary', colStartIndex, columnStyle);

    await this.excelWorkbook.saveLocal();
    await this.excelWorkbook.saveS3('Reconciliation Report');
  }

  async findPaymentDataForDailySummary(
    date: string,
    location: LocationEntity,
    program: Ministries
  ): Promise<DailySummary> {
    const payments = await this.paymentService.findPaymentsWithPartialSelect(
      location,
      date
    );
    const exceptions = payments.filter(
      (itm: PaymentEntity) => itm.status === 'EXCEPTION'
    ).length;

    const total = payments.length;

    const unmatchedPercentage =
      total != 0 ? parseFloat(((exceptions / total) * 100).toFixed(2)) : 0;

    /*eslint-disable */
    const totalSum = payments.reduce(
      (acc: number, itm: PaymentEntity) => (acc += itm.amount),
      0
    );

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
      style: rowStyle(exceptions !== 0)
    };
  }

  async findAndParseDataForDetailedReport(
    config: ReportConfig,
    location: LocationEntity
  ): Promise<DetailsReport[]> {
    const dateRange = {
      to_date: config.period.to.toString(),
      from_date: config.period.from.toString()
    };

    const cashDepositDates = await Promise.all(
      await this.cashDepositService.findDistinctDepositDates(
        config.program,
        dateRange,
        location
      )
    );

    const cashDepositDateRange = {
      to_date: cashDepositDates[0],
      from_date: cashDepositDates[1]
    };

    const cashPayments = await Promise.all(
      await this.paymentService.findCashPayments(
        cashDepositDateRange,
        location,
        MatchStatus.ALL
      )
    );

    const parsedCashPayments = cashPayments.map((itm: PaymentEntity) =>
      parsePaymentDetailsForReport(location, itm, cashDepositDates)
    );

    const posPayments: PaymentEntity[] = await Promise.all(
      await this.paymentService.findPosPayments(
        location,
        config.period.to.toString()
      )
    );

    const parsedPosPayments = posPayments.map((itm: PaymentEntity) =>
      parsePaymentDetailsForReport(location, itm)
    );

    const cashDeposits: CashDepositEntity[] = await Promise.all(
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        config.program,
        cashDepositDateRange.to_date,
        location,
        MatchStatus.ALL
      )
    );

    const parsedCashDepositDetails = cashDeposits.map(
      (itm: CashDepositEntity) =>
        parseCashDepositDetailsForReport(location, itm, cashDepositDates)
    );

    const posDeposits: POSDepositEntity[] = await Promise.all(
      await this.posDepositService.findPOSDeposits({
        program: config.program,
        date: config.period.to.toString(),
        location: location
      } as ReconciliationEvent)
    );

    const parsedPosDepositDetails = posDeposits.map((itm: POSDepositEntity) =>
      parsePosDepositDetailsForReport(location, itm)
    );

    return await Promise.all([
      ...parsedPosPayments,
      ...parsedCashPayments,
      ...parsedCashDepositDetails,
      ...parsedPosDepositDetails
    ]);
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
