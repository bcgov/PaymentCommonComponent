import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format, getMonth, getYear, parse } from 'date-fns';
import { Repository } from 'typeorm';
import { CasReport } from './cas-report/cas-report';
import {
  dailySummaryColumns,
  detailedReportColumns,
  Report,
  casReportColumns
} from './const';
import { DetailedReportService } from './details-report.service';
import { DailySummary, ReportConfig } from './interfaces';
import { columnStyle, rowStyle, titleStyle, placement } from './styles';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { ExcelExportService } from '../excelexport/excelexport.service';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from './../transaction/payment.service';

export class ReportingService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @Inject(LocationService)
    private locationService: LocationService,
    @Inject(PaymentService)
    private paymentService: PaymentService,
    @Inject(DetailedReportService)
    private detailedReportService: DetailedReportService,
    @Inject(CashDepositService)
    private cashDepositService: CashDepositService,
    @Inject(PosDepositService)
    private posDepositService: PosDepositService,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(ExcelExportService)
    private excelWorkbook: ExcelExportService
  ) {}
  /**
   * @param config
   */
  async generateReport(config: ReportConfig): Promise<void> {
    const locations = await this.locationService.getLocationsBySource(
      config.program
    );

    this.appLogger.log(
      `Generating Reconciliation Report For ${locations.length} locations`,
      ReportingService.name
    );

    this.excelWorkbook.addWorkbookMetadata('Reconciliation Report');
    await this.generateDailySummary(config, locations);
    await this.generateDetailsWorksheet(config, locations);
    await this.generateCasReportWorksheet(config, locations);
    await this.excelWorkbook.saveS3('reconciliation_report', config.period.to);
    if (process.env.RUNTIME_ENV !== 'production') {
      await this.excelWorkbook.saveLocal();
    }
  }
  /**
   *
   * @param config
   * @param locations
   */
  async generateCasReportWorksheet(
    config: ReportConfig,
    locations: LocationEntity[]
  ): Promise<void> {
    const details: CasReport[] = [];

    const to_date = parse(config.period.to, 'yyyy-MM-dd', new Date());
    /* extract the month from the "to-date"*/
    const from_date = new Date(getYear(to_date), getMonth(to_date), 1);

    const dateRange = {
      from_date: format(from_date, 'yyyy-MM-dd'),
      to_date: format(to_date, 'yyyy-MM-dd')
    };
    this.appLogger.log(
      `Generating cas report for: ${format(from_date, 'yyyy-MM-dd')}-${format(
        to_date,
        'yyyy-MM-dd'
      )}`,
      ReportingService.name
    );
    await Promise.all(
      locations.map(async (itm) => {
        const values = await this.findDataForCasReport(config, itm, dateRange);
        details.push(...values);
      })
    );

    const startIndex = 2;
    const rowStartIndex = 3;
    this.excelWorkbook.addSheet(Report.CAS_REPORT);

    this.excelWorkbook.addColumns(Report.CAS_REPORT, casReportColumns);
    this.excelWorkbook.addRows(
      Report.CAS_REPORT,
      details.map((itm) => ({ values: itm, style: rowStyle() })),
      startIndex
    );
    this.excelWorkbook.addTitleRow(
      Report.CAS_REPORT,
      `${dateRange.from_date}-${dateRange.to_date}`,
      titleStyle,
      placement('A1:J1')
    );

    /* set column-headers style */
    this.excelWorkbook.addRowStyle(Report.CAS_REPORT, startIndex, columnStyle);

    const filterOptions = {
      from: {
        column: 1,
        row: 2
      },
      to: {
        column: casReportColumns.length,
        row: details.length + 1
      }
    };

    this.excelWorkbook.addFilterOptions(Report.CAS_REPORT, filterOptions);
    this.excelWorkbook.addNumberFormatting(Report.CAS_REPORT, rowStartIndex, [
      'F',
      'H',
      'I',
      'J'
    ]);
  }
  /**
   *
   * @param config
   * @param location
   * @returns
   */
  async findDataForCasReport(
    config: ReportConfig,
    location: LocationEntity,
    dateRange: DateRange
  ): Promise<CasReport[]> {
    const cashDepositsResults: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsForReport(
        location,
        config.program,
        dateRange
      );

    const cashDeposits = cashDepositsResults
      .filter((itm) => itm.deposit_amt_cdn.toString() !== '0.00')
      .map((itm) => ({
        deposit_date: itm.deposit_date,
        deposit_amt_cdn: itm.deposit_amt_cdn
      }));

    const posDeposits: POSDepositEntity[] =
      await this.posDepositService.findPOSBySettlementDate(
        location,
        config.program,
        dateRange
      );

    const mappedPosDeposits = posDeposits
      .filter((itm) => itm.transaction_amt.toString() !== '0.00')
      .map(
        ({ payment_method, settlement_date, transaction_amt }) =>
          new CasReport({
            location,
            payment_method,
            settlement_date,
            amount: parseFloat(transaction_amt.toString())
          })
      );

    const mappedCashDeposits = cashDeposits.map(
      (itm) =>
        new CasReport({
          location,
          payment_method: 'CASH DEPOSIT',
          settlement_date: itm.deposit_date,
          amount: itm.deposit_amt_cdn
        })
    );

    const report: CasReport[] = [...mappedCashDeposits, ...mappedPosDeposits];

    return report;
  }

  /**
   * @param config
   * @param locations
   */
  async generateDetailsWorksheet(
    config: ReportConfig,
    locations: LocationEntity[]
  ): Promise<void> {
    this.appLogger.log(config);
    this.appLogger.log('Generating Reconciliation Details Worksheet');

    const data: unknown[] = [];

    for (const location of locations) {
      const details =
        await this.detailedReportService.findDataForDetailedReport(
          config,
          location
        );
      data.push(...details);
    }

    this.appLogger.log(
      `Detailed Report line items: ${data.length}`,
      ReportingService.name
    );

    const startIndex = 2;

    this.excelWorkbook.addSheet(Report.DETAILED_REPORT);

    this.excelWorkbook.addColumns(
      Report.DETAILED_REPORT,
      detailedReportColumns
    );
    this.excelWorkbook.addRows(
      Report.DETAILED_REPORT,
      data.map((itm) => ({ values: itm, style: rowStyle() })),
      startIndex
    );
    this.excelWorkbook.addTitleRow(
      Report.DETAILED_REPORT,
      config.period.to,
      titleStyle,
      placement('A1:AC1')
    );

    /* set column-headers style */
    this.excelWorkbook.addRowStyle(
      Report.DETAILED_REPORT,
      startIndex,
      columnStyle
    );

    const filterOptions = {
      from: {
        column: 1,
        row: 2
      },
      to: {
        column: detailedReportColumns.length,
        row: data.length + 1
      }
    };

    this.excelWorkbook.addFilterOptions(Report.DETAILED_REPORT, filterOptions);
  }
  /**
   *
   * @param config
   * @param locations
   */
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
            config.period.to,
            location,
            config.program
          )
      )
    );

    const startIndex = 2;

    this.excelWorkbook.addSheet(Report.DAILY_SUMMARY);

    this.excelWorkbook.addColumns(Report.DAILY_SUMMARY, dailySummaryColumns);

    this.excelWorkbook.addRows(
      Report.DAILY_SUMMARY,
      dailySummaryReport,
      startIndex
    );
    this.excelWorkbook.addTitleRow(
      Report.DAILY_SUMMARY,
      config.period.to,
      titleStyle,
      placement('A1:H1')
    );
    /* set column-headers style */
    this.excelWorkbook.addRowStyle(
      Report.DAILY_SUMMARY,
      startIndex,
      columnStyle
    );
    const filterOptions = {
      from: {
        column: 1,
        row: 2
      },
      to: {
        column: dailySummaryColumns.length,
        row: dailySummaryReport.length
      }
    };

    this.excelWorkbook.addFilterOptions(Report.DAILY_SUMMARY, filterOptions);
  }
  /**
   *
   * @param date
   * @param location
   * @param program
   * @returns
   */
  async findPaymentDataForDailySummary(
    date: string,
    location: LocationEntity,
    program: Ministries
  ): Promise<DailySummary> {
    const payments = await this.paymentService.findPaymentsForDailySummary(
      location,
      date
    );
    const exceptions = payments.filter(
      (itm: PaymentEntity) => itm.status === MatchStatus.EXCEPTION
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

  /**
   *
   * @returns
   */
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
          p."payment_method" in ('P', 'V', 'AX', 'M')
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
            p."payment_method" in ('P', 'V', 'AX', 'M')
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
  /**
   *
   * @returns
   */
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
            p."payment_method" 
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
              p."payment_method" 
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
          p."payment_method" 
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
            p."payment_method" 
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
