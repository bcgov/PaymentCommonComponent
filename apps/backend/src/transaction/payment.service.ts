import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { Raw, In, Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { DateRange, PaymentMethodClassification } from '../constants';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { AggregatedCashPayment } from '../reconciliation/types/interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  async findPosPayments(
    dateRange: DateRange,
    location_ids: number[],
    statuses?: MatchStatus[],
    pos_deposit_match = false
  ): Promise<PaymentEntity[]> {
    const paymentStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;

    return await this.paymentRepo.find({
      where: {
        transaction: {
          transaction_date: Raw(
            (alias) => `${alias} >= :minDate AND ${alias} <= :maxDate`,
            { minDate, maxDate }
          ),
          location_id: In(location_ids),
        },
        status: In(paymentStatuses),
        payment_method: { classification: PaymentMethodClassification.POS },
      },
      relations: {
        payment_method: true,
        transaction: true,
        pos_deposit_match,
      },
      order: {
        transaction: { transaction_date: 'ASC', transaction_time: 'ASC' },
        amount: 'ASC',
        payment_method: { method: 'ASC' },
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
          location_id,
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

  public async findPaymentsByPosDeposits(posDeposits: POSDepositEntity[]) {
    return await this.paymentRepo.find({
      where: {
        pos_deposit_match: In(posDeposits.map((posDeposit) => posDeposit.id)),
      },
      relations: {
        transaction: true,
        payment_method: true,
        pos_deposit_match: true,
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
            location_id: payment.transaction.location_id,
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

  public async findPaymentsForDailySummary(
    location_id: number,
    date: string,
    pos_deposit_match = false
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      select: {
        amount: true,
        payment_method: {
          method: true,
        },
        status: true,
        transaction: {
          transaction_date: true,
          location_id: true,
        },
      },
      where: {
        transaction: {
          location_id,
          transaction_date: date,
        },
      },
      relations: {
        transaction: true,
        payment_method: true,
        pos_deposit_match,
      },
    });
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
    statuses?: MatchStatus[],
    cash_deposit_match?: boolean
  ): Promise<PaymentEntity[]> {
    const paymentStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;
    const payments = await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: In(paymentStatuses),
        transaction: {
          location_id: In(location_ids),
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

  async getAggregatedCashPaymentsByCashDepositDates(
    dateRange: DateRange,
    location_id: number
  ): Promise<AggregatedCashPayment[]> {
    const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

    return this.aggregatePayments(
      await this.findCashPayments(dateRange, [location_id], status)
    );
  }

  public async findPaymentsExceptions(
    location_id: number,
    pastDueDepositDate: string
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: MatchStatus.IN_PROGRESS,
        transaction: {
          location_id: location_id,
          fiscal_close_date: LessThanOrEqual(pastDueDepositDate),
        },
      },
      relations: {
        transaction: true,
        payment_method: true,
      },
    });
  }

  async findMatchedPosPayments(
    posDeposits: POSDepositEntity[],
    pos_deposit_match = false
  ) {
    return await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        pos_deposit_match: In(posDeposits.map((itm) => itm.id)),
      },
      relations: {
        transaction: true,
        payment_method: true,
        pos_deposit_match,
      },
    });
  }
  /**
   * Update payments matched on round four heuristics - calling "save" as "update" will not trigger the cascade for the many to many relations
   * @param payments
   * @returns
   */
  async updatePayments(payments: PaymentEntity[]): Promise<PaymentEntity[]> {
    await this.paymentRepo.manager.transaction(
      async (manager) =>
        await Promise.all(
          payments.map((itm) => manager.save(PaymentEntity, itm))
        )
    );
    return payments;
  }

  /**
   * updatePaymentStatus
   * This will update all payments.
   * This should be more performant as it is wrapped in a transaction
   * @param payments A list of payment entities to set a new status for, with the expected heuristic round
   * @returns {PaymentEntity[]} The same list of payments passed in
   */
  async updatePaymentStatus(
    payments: PaymentEntity[]
  ): Promise<PaymentEntity[]> {
    // TODO: Wrap in a try catch
    await this.paymentRepo.manager.transaction(async (manager) => {
      await Promise.all(
        payments.map((p) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { timestamp, ...pay } = p;
          return manager.update(
            PaymentEntity,
            { id: pay.id },
            {
              ...pay,
              pos_deposit_match: {
                ...p.pos_deposit_match,
              },
            }
          );
        })
      );
    });
    return payments;
  }

  async findPosPaymentsByMatchedDepositId(
    posDeposits: POSDepositEntity[],
    pos_deposit_match = false
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: { pos_deposit_match: In(posDeposits.map((itm) => itm.id)) },
      relations: {
        transaction: true,
        payment_method: true,
        pos_deposit_match,
      },
    });
  }

  async findCashPaymentsByDepositMatch(cashDeposits: CashDepositEntity[]) {
    return await this.paymentRepo.find({
      where: {
        cash_deposit_match: In(cashDeposits.map((itm) => itm.id)),
      },
      relations: {
        transaction: true,
        payment_method: true,
        cash_deposit_match: true,
      },
    });
  }
}
