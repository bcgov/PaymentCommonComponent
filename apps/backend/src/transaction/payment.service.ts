import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addBusinessDays, parse, subBusinessDays } from 'date-fns';
import Decimal from 'decimal.js';
import {
  Raw,
  In,
  Repository,
  LessThanOrEqual,
  LessThan,
  Between,
} from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
import {
  DateRange,
  Ministries,
  PaymentMethodClassification,
} from '../constants';
import { AppLogger } from '../logger/logger.service';
import { AggregatedCashPayment } from '../reconciliation/types/interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(PaymentService.name);
  }

  async findPaymentsByMinistryAndMethod(
    program: Ministries,
    date: string,
    method: PaymentMethodClassification,
    statuses: MatchStatus[] = MatchStatusAll
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        transaction: {
          source_id: program,
          transaction_date: LessThanOrEqual(date),
        },
        status: In(statuses),
        payment_method: { classification: method },
      },
      order: {
        transaction: { transaction_date: 'ASC', transaction_time: 'ASC' },
        amount: 'ASC',
        payment_method: { method: 'ASC' },
      },
      relations: {
        transaction: true,
        payment_method: true,
      },
    });
  }

  /**
   * findPosPaymentExceptions - Finds all payments to mark as exceptions
   * @param maxDate
   * @param location
   * @returns
   */
  public async findPosPaymentExceptions(
    maxDate: string,
    location_id: number
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        transaction: {
          transaction_date: LessThan(maxDate),
          location: { location_id },
        },
        status: MatchStatus.IN_PROGRESS,
        payment_method: { classification: PaymentMethodClassification.POS },
      },
      relations: {
        payment_method: true,
        transaction: true,
      },
      order: {
        transaction: { transaction_date: 'ASC', transaction_time: 'ASC' },
        amount: 'ASC',
        payment_method: { method: 'ASC' },
      },
    });
  }

  public aggregatePayments(payments: PaymentEntity[]): AggregatedCashPayment[] {
    const groupedPayments = payments.reduce(
      (
        acc: { [key: string]: AggregatedCashPayment },
        payment: PaymentEntity
      ) => {
        const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
        if (!acc[key]) {
          acc[key] = {
            status: payment.status,
            classification: payment.payment_method.classification,
            fiscal_close_date: payment.transaction.fiscal_close_date,
            amount: new Decimal(0),
            payments: [],
            location_id: payment.transaction.location.location_id,
            cash_deposit_match: undefined,
          };
        }

        acc[key].amount = acc[key].amount.plus(payment.amount);
        acc[key].payments.push(payment);
        return acc;
      },
      {}
    );
    const aggPayments: AggregatedCashPayment[] = Object.values(groupedPayments);
    return aggPayments.sort(
      (a: AggregatedCashPayment, b: AggregatedCashPayment) =>
        a.amount.minus(b.amount).toNumber()
    );
  }

  /**
   *
   * @param dateRange - to: The most current cash deposit date, from: the fiscal_start_date (any previous payments older than two cash_deposit_dates prior will have already been reconciled)
   * @param location
   * @param status
   * @returns
   */
  public async findCashPayments(
    dateRange: DateRange,
    location_ids: number[],
    statuses: MatchStatus[] = MatchStatusAll,
    cash_deposit_match?: boolean
  ): Promise<PaymentEntity[]> {
    const { minDate, maxDate } = dateRange;
    const payments = await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: In(statuses),
        transaction: {
          location: { location_id: In(location_ids) },
          fiscal_close_date: Raw(
            (alias) => `${alias} >= :minDate AND ${alias} <= :maxDate`,
            {
              minDate,
              maxDate,
            }
          ),
        },
      },
      relations: {
        transaction: true,
        payment_method: true,
        cash_deposit_match: cash_deposit_match ?? false,
      },
      order: {
        transaction: { fiscal_close_date: 'ASC' },
        amount: 'ASC',
      },
    });

    return payments;
  }
  /**
   *
   * @param dateRange
   * @param location_id
   * @returns
   */
  async getAggregatedCashPaymentsByCashDepositDates(
    dateRange: DateRange,
    location_id: number
  ): Promise<AggregatedCashPayment[]> {
    const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

    return this.aggregatePayments(
      await this.findCashPayments(dateRange, [location_id], status)
    );
  }

  /**
   *
   * @param location_id
   * @param pastDueDepositDate
   * @returns
   */
  public async findPaymentsExceptions(
    location_id: number,
    pastDueDepositDate: string
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: MatchStatus.IN_PROGRESS,
        transaction: {
          location: { location_id },
          fiscal_close_date: LessThanOrEqual(pastDueDepositDate),
        },
      },
      relations: {
        transaction: true,
        payment_method: true,
      },
    });
  }

  /**
   * updatePaymentStatus
   * This will update all payments.
   * This should be more performant as it is wrapped in a transaction
   * @param payments A list of payment entities to set a new status for, with the expected heuristic round
   * @returns {PaymentEntity[]} The same list of payments passed in
   */
  async updatePayments(payments: PaymentEntity[]): Promise<PaymentEntity[]> {
    try {
      return await this.paymentRepo.manager.transaction(
        async (manager) =>
          await Promise.all(
            payments.map((itm) => manager.save(PaymentEntity, itm))
          )
      );
    } catch (e) {
      this.logger.error(e);
      throw new Error();
    }
  }
  /**
   * Find all payments for the details report - return any entities marked as matched or in progress on this day as well as any pending
   * @param program
   * @param classification
   * @returns
   */
  async findPaymentsForDetailsReport(
    dateRange: DateRange,
    classification: PaymentMethodClassification,
    program: Ministries,
    busDays: number
  ): Promise<PaymentEntity[]> {
    const reconciled = await this.paymentRepo.find({
      where: {
        reconciled_on: Between(
          subBusinessDays(
            parse(dateRange.minDate, 'yyyy-MM-dd', new Date()),
            busDays
          ),
          addBusinessDays(
            parse(dateRange.maxDate, 'yyyy-MM-dd', new Date()),
            busDays
          )
        ),
        status: In([MatchStatus.MATCH, MatchStatus.EXCEPTION]),
        transaction: {
          source_id: program,
        },
        payment_method: { classification },
      },
      order: {
        transaction: { location: { location_id: 'ASC' } },
        reconciled_on: 'ASC',
        amount: 'ASC',
        status: 'ASC',
      },
      relations: {
        pos_deposit_match: true,
        cash_deposit_match: true,
      },
    });

    const in_progress = await this.paymentRepo.find({
      where: {
        in_progress_on: Between(
          parse(dateRange.minDate, 'yyyy-MM-dd', new Date()),
          parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
        ),
        status: MatchStatus.IN_PROGRESS,
        transaction: {
          source_id: program,
        },
        payment_method: { classification },
      },
      order: {
        transaction: { location: { location_id: 'ASC' } },
        in_progress_on: 'ASC',
        amount: 'ASC',
      },
    });
    const { minDate, maxDate } = dateRange;
    const pending = await this.paymentRepo.find({
      where: {
        status: MatchStatus.PENDING,
        payment_method: { classification },
        transaction: {
          transaction_date: Raw(
            (alias) => `${alias} >= :minDate and ${alias} <= :maxDate`,
            { minDate, maxDate }
          ),
          source_id: program,
        },
      },
      order: {
        transaction: {
          location: { location_id: 'ASC' },
          transaction_date: 'ASC',
        },
        amount: 'ASC',
      },
    });

    return [...reconciled, ...in_progress, ...pending];
  }
}
