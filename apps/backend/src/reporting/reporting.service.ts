import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { Repository } from 'typeorm';
import { CasReport } from './cas-report/cas-report';
import {
  dailySummaryColumns,
  detailedReportColumns,
  Report,
  casReportColumns,
} from './const';
import {
  CashDepositDetailsReport,
  DetailsReport,
  PaymentDetailsReport,
  POSDepositDetailsReport,
} from './detailed-report';
import { DailySummary, ReportConfig } from './interfaces';
import { columnStyle, rowStyle, titleStyle, placement } from './styles';
import { MatchStatus } from '../common/const';
import {
  DateRange,
  NormalizedLocation,
  PaymentMethodClassification,
} from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { ExcelExportService } from '../excelexport/excelexport.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities';

export class ReportingService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
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
   * Generates a three page daily report
   * @param config
   */
  async generateReport(
    config: ReportConfig,
    locations: NormalizedLocation[],
    posDeposits: POSDepositEntity[],
    posPayments: PaymentEntity[],
    cashDeposits: {
      pending: CashDepositEntity[];
      current: CashDepositEntity[];
    },
    cashPayments: {
      pending: PaymentEntity[];
      current: { payments: PaymentEntity[]; dateRange: DateRange }[];
    },
    casDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] },
    casDates: DateRange
  ): Promise<void> {
    this.excelWorkbook.addWorkbookMetadata('Reconciliation Report');

    //page 1 - summary page
    this.generateDailySummary(
      config,
      posPayments.filter(
        (itm) => itm.transaction.transaction_date === config.period.to
      ),
      cashPayments.current.flatMap((itm) =>
        itm.payments.filter(
          (itm) => itm.transaction.fiscal_close_date === config.period.to
        )
      ),
      locations
    );

    //page 2 - details page
    this.generateDetailsWorksheet(
      config,
      posDeposits,
      posPayments,
      cashDeposits,
      cashPayments,
      locations
    );

    // page 3 - cas report (includes deposit data from the start of the month up to the current date)
    this.generateCasReportWorksheet(config, locations, casDeposits, casDates);

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
  async generateDailySummary(
    config: ReportConfig,
    posPayments: PaymentEntity[],
    cashPayments: PaymentEntity[],
    locations: NormalizedLocation[]
  ): Promise<void> {
    this.appLogger.log(config);
    this.appLogger.log(
      'Generating Daily Summary WorkSheet',
      ReportingService.name
    );

    const summaryData: DailySummary[] = this.getSummaryData(
      config,
      locations,
      posPayments,
      cashPayments
    );

    const startIndex = 2;

    this.excelWorkbook.addSheet(Report.DAILY_SUMMARY);

    this.excelWorkbook.addColumns(Report.DAILY_SUMMARY, dailySummaryColumns);

    this.excelWorkbook.addRows(Report.DAILY_SUMMARY, summaryData, startIndex);
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
        row: 2,
      },
      to: {
        column: dailySummaryColumns.length,
        row: summaryData.length,
      },
    };

    this.excelWorkbook.addFilterOptions(Report.DAILY_SUMMARY, filterOptions);
  }

  /**
   * Daily Report for all Matched/Exceptions payments and deposits for a date or date range
   * Includes all pending or in progress within the config period
   * @param config
   * @param locations
   */
  async generateDetailsWorksheet(
    config: ReportConfig,
    posDeposits: POSDepositEntity[],
    posPayments: PaymentEntity[],
    cashDeposits: {
      pending: CashDepositEntity[];
      current: CashDepositEntity[];
    },
    cashPayments: {
      pending: PaymentEntity[];
      current: { payments: PaymentEntity[]; dateRange: DateRange }[];
    },
    locations: NormalizedLocation[]
  ): Promise<void> {
    this.appLogger.log(config);
    this.appLogger.log(
      'Generating Reconciliation Details Worksheet',
      ReportingService.name
    );

    // format cash and pos payments and deposits according to the details report interface
    const detailsData: DetailsReport[] = this.getDetailsReportData(
      posDeposits,
      posPayments,
      cashDeposits,
      cashPayments,
      locations
    );

    const startIndex = 2;

    this.excelWorkbook.addSheet(Report.DETAILED_REPORT);

    this.excelWorkbook.addColumns(
      Report.DETAILED_REPORT,
      detailedReportColumns
    );

    this.excelWorkbook.addRows(
      Report.DETAILED_REPORT,
      detailsData.map((itm) => ({ values: itm, style: rowStyle() })),
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
        row: 2,
      },
      to: {
        column: detailedReportColumns.length,
        row: detailsData.length + 1,
      },
    };

    this.excelWorkbook.addFilterOptions(Report.DETAILED_REPORT, filterOptions);
  }
  /**
   * Deposit report for all deposits from the start of the month up to the current date
   * @param config
   * @param locations
   */
  async generateCasReportWorksheet(
    config: ReportConfig,
    locations: NormalizedLocation[],
    casDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] },
    casDates: DateRange
  ): Promise<void> {
    this.appLogger.log(
      `Generating cas report for: ${casDates.minDate}-${casDates.maxDate}`,
      ReportingService.name
    );

    // query for the CAS report data
    const details: CasReport[] = this.getCasReportData(locations, casDeposits);

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
      `${casDates.minDate}-${casDates.maxDate}`,
      titleStyle,
      placement('A1:J1')
    );

    /* set column-headers style */
    this.excelWorkbook.addRowStyle(Report.CAS_REPORT, startIndex, columnStyle);

    const filterOptions = {
      from: {
        column: 1,
        row: 2,
      },
      to: {
        column: casReportColumns.length,
        row: details.length + 1,
      },
    };

    this.excelWorkbook.addFilterOptions(Report.CAS_REPORT, filterOptions);
    this.excelWorkbook.addNumberFormatting(Report.CAS_REPORT, rowStartIndex, [
      'F',
      'H',
      'I',
      'J',
    ]);
  }
  /**
   * Format the data for the daily summary report
   * @param config
   * @param locations
   * @param posPayments
   * @param cashPayments
   * @returns
   */
  public getSummaryData(
    config: ReportConfig,
    locations: NormalizedLocation[],
    posPayments: PaymentEntity[],
    cashPayments: PaymentEntity[]
  ): DailySummary[] {
    const summaryData: DailySummary[] = [];
    locations.forEach((location) => {
      const paymentsByLocation = [...posPayments, ...cashPayments].filter(
        (itm) => itm.transaction.location_id === location.location_id
      );

      const exceptions = paymentsByLocation.filter(
        (itm: PaymentEntity) => itm.status === MatchStatus.EXCEPTION
      );

      const total = paymentsByLocation.length;

      const unmatchedPercentage =
        total != 0
          ? parseFloat(((exceptions.length / total) * 100).toFixed(2))
          : 0;

      /*eslint-disable */
      const totalSum = paymentsByLocation.reduce(
        (acc: number, itm: PaymentEntity) => (acc += itm.amount),
        0
      );

      summaryData.push({
        values: {
          program: config.program,
          date: config.period.to,
          location_id: location.location_id,
          location_name: location.description,
          total_payments: total,
          total_unmatched_payments: exceptions.length,
          percent_unmatched: unmatchedPercentage,
          total_sum: parseFloat(totalSum.toFixed(2)),
        },
        style: rowStyle(exceptions.length !== 0),
      });
    });
    return summaryData;
  }
  /**
   * Format the data for the detailed report
   * @param posDeposits
   * @param cashDeposits
   * @param posPayments
   * @param cashPayments
   * @param locations
   * @returns
   */
  public getDetailsReportData(
    posDeposits: POSDepositEntity[],
    posPayments: PaymentEntity[],
    cashDeposits: {
      pending: CashDepositEntity[];
      current: CashDepositEntity[];
    },
    cashPayments: {
      pending: PaymentEntity[];
      current: { payments: PaymentEntity[]; dateRange: DateRange }[];
    },
    locations: NormalizedLocation[]
  ): DetailsReport[] {
    const detailedReport: DetailsReport[] = [];
    locations.forEach((location: NormalizedLocation) => {
      const filteredDeposits = posDeposits
        .filter((deposit) =>
          location.merchant_ids.includes(deposit.merchant_id)
        )
        .map((deposit) => new POSDepositDetailsReport(location, deposit));

      const filteredCashDeposits = [
        ...cashDeposits.pending,
        ...cashDeposits.current,
      ]
        .filter((deposit) => location.pt_location_id === deposit.pt_location_id)
        .map(
          (deposit: CashDepositEntity) =>
            new CashDepositDetailsReport(location, deposit)
        );
      const cashPaymentsCurrentWithDateRange = cashPayments.current.flatMap(
        (itm) =>
          itm.payments
            .filter(
              (itm) => itm.transaction.location_id === location.location_id
            )
            .map(
              (payment) =>
                new PaymentDetailsReport(location, payment, itm.dateRange)
            )
      );
      const payments = [...posPayments, ...cashPayments.pending]
        .filter((itm) => itm.transaction.location_id === location.location_id)
        .map(
          (payment: PaymentEntity) =>
            new PaymentDetailsReport(location, payment)
        );
      detailedReport.push(
        ...filteredDeposits,
        ...filteredCashDeposits,
        ...payments,
        ...cashPaymentsCurrentWithDateRange
      );
    });
    return detailedReport;
  }
  /**
   * Query for CAS report data
   * @param config
   * @param locations
   * @param dateRange
   * @returns
   */
  public getCasReportData(
    locations: NormalizedLocation[],
    casDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] }
  ): CasReport[] {
    const cashDepositsResults: CashDepositEntity[] = casDeposits.cash;
    const posDeposits: POSDepositEntity[] = casDeposits.pos;

    const report: CasReport[] = [];

    locations.forEach((location) => {
      cashDepositsResults
        .filter(
          (itm) =>
            itm.deposit_amt_cdn.toString() !== '0.00' &&
            itm.pt_location_id === location.pt_location_id
        )
        .forEach((itm) =>
          report.push(
            new CasReport(
              'CASH DEPOSIT',
              itm.deposit_date,
              itm.deposit_amt_cdn,
              location
            )
          )
        );
    });
    locations.forEach((location) => {
      posDeposits
        .filter(
          (itm) =>
            itm.transaction_amt.toString() !== '0.00' &&
            // in this instance merchant_id is the same as location_id
            location.location_id === itm.merchant_id
        )
        .forEach(({ payment_method, settlement_date, transaction_amt }) =>
          report.push(
            new CasReport(
              payment_method,
              settlement_date,
              parseFloat(transaction_amt.toString()),
              location
            )
          )
        );
    });
    return report;
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
  async getStatusReport() {
    const qb = this.paymentRepo.createQueryBuilder('payment');
    qb.select('payment.status');
    qb.addSelect('COUNT(payment.status)', 'count');
    qb.leftJoin('payment.payment_method', 'payment_method');
    qb.andWhere('payment_method.classification = :classification', {
      classification: PaymentMethodClassification.POS,
    });
    qb.groupBy('payment.status');
    const paymentStatus = await qb.getRawMany();
    const qb2 = this.posDepositRepo.createQueryBuilder('pos_deposit');
    qb2.select('pos_deposit.status');
    qb2.addSelect('COUNT(pos_deposit.status)', 'count');
    qb2.groupBy('pos_deposit.status');
    const depositStatus = await qb2.getRawMany();
    return { paymentStatus, depositStatus };
  }

  async getHeuristicRoundReport() {
    const qb = this.paymentRepo.createQueryBuilder('payment');
    qb.select('payment.heuristic_match_round');
    qb.addSelect('COUNT(payment.heuristic_match_round)', 'count');
    qb.leftJoin('payment.payment_method', 'payment_method');
    qb.andWhere('payment_method.classification = :classification', {
      classification: PaymentMethodClassification.POS,
    });
    qb.groupBy('payment.heuristic_match_round');
    const paymentHeuristicRound = await qb.getRawMany();
    const qb2 = this.posDepositRepo.createQueryBuilder('pos_deposit');
    qb2.select('pos_deposit.heuristic_match_round');
    qb2.addSelect('COUNT(pos_deposit.heuristic_match_round)', 'count');
    qb2.groupBy('pos_deposit.heuristic_match_round');
    const posDepositHeuristicRound = await qb2.getRawMany();
    return { paymentHeuristicRound, posDepositHeuristicRound };
  }

  async getPosDepositStatusByDate() {
    const query = `select
                  	pos_deposit.transaction_date::varchar,
                  	pos_pending.pending_count::int,
                  	pos_inprogress.in_progress_count::int,
                  	pos_match.match_count::int,
                  	pos_exception.exception_count::int
                  from
                  	pos_deposit
                  left join 
                  	(
                  	select
                  		COUNT(status) as pending_count,
                  		transaction_date
                  	from
                  		pos_deposit pd
                  	where
                  		status = 'PENDING'
                  	group by
                  		transaction_date
                  	order by
                  		transaction_date asc) as pos_pending on
                  	pos_pending.transaction_date = pos_deposit.transaction_date
                  left join (
                  	select
                  		COUNT(status) as IN_PROGRESS_COUNT,
                  		transaction_date
                  	from
                  		pos_deposit pd
                  	where
                  		status = 'IN_PROGRESS'
                  	group by
                  		transaction_date
                  	order by
                  		transaction_date asc) as pos_inprogress on
                  	pos_inprogress.transaction_date = pos_deposit.transaction_date
                  left join (
                  	select
                  		COUNT(status) as match_count,
                  		transaction_date
                  	from
                  		pos_deposit pd
                  	where
                  		status = 'MATCH'
                  	group by
                  		transaction_date
                  	order by
                  		transaction_date asc) as pos_match on
                  	pos_match.transaction_date = pos_deposit.transaction_date
                  left join (
                  	select
                  		COUNT(status) as exception_count,
                  		transaction_date
                  	from
                  		pos_deposit pd
                  	where
                  		status = 'EXCEPTION'
                  	group by
                  		transaction_date
                  	order by
                  		transaction_date asc) as pos_exception on
                  	pos_exception.transaction_date = pos_deposit.transaction_date
                  group by
                  	pos_deposit.transaction_date,
                  	pos_pending.pending_count,
                  	pos_inprogress.in_progress_count,
                  	pos_match.match_count,
                  	pos_exception.exception_count
                  order by
                  	pos_deposit.transaction_date asc`;
    return await this.paymentRepo.manager.query(query);
  }

  async getCashDepositStatusByDate() {
    const query = `select
                    	cash_deposit.deposit_date::varchar,
                    	cash_pending.pending_count::int,
                    	cash_inprogress.in_progress_count::int,
                    	cash_match.match_count::int,
                    	cash_exception.exception_count::int
                    from
                    				cash_deposit
                    left join 
                                      	(
                    	select
                    		COUNT(status) as pending_count,
                    		deposit_date
                    	from
                    		cash_Deposit pd
                    	where
                    		status = 'PENDING'
                    	group by
                    		deposit_date
                    	order by
                    		deposit_date asc) as cash_pending on
                    	cash_pending.deposit_date = cash_Deposit.deposit_date
                    left join (
                    	select
                    		COUNT(status) as IN_PROGRESS_COUNT,
                    		deposit_date
                    	from
                    		cash_Deposit pd
                    	where
                    		status = 'IN_PROGRESS'
                    	group by
                    		deposit_date
                    	order by
                    		deposit_date asc) as cash_inprogress on
                    	cash_inprogress.deposit_date = cash_Deposit.deposit_date
                    left join (
                    	select
                    		COUNT(status) as match_count,
                    		deposit_date
                    	from
                    		cash_Deposit pd
                    	where
                    		status = 'MATCH'
                    	group by
                    		deposit_date
                    	order by
                    		deposit_date asc) as cash_match on
                    	cash_match.deposit_date = cash_Deposit.deposit_date
                    left join (
                    	select
                    		COUNT(status) as exception_count,
                    		deposit_date
                    	from
                    		cash_Deposit pd
                    	where
                    		status = 'EXCEPTION'
                    	group by
                    		deposit_date
                    	order by
                    		deposit_date asc) as cash_exception on
                    	cash_exception.deposit_date = cash_Deposit.deposit_date
                    group by
                    				cash_deposit.deposit_date,
                    	cash_pending.pending_count,
                    	cash_inprogress.in_progress_count,
                    	cash_match.match_count,
                    	cash_exception.exception_count
                    order by
                    				cash_deposit.deposit_date asc`;
    return await this.paymentRepo.manager.query(query);
  }
}
