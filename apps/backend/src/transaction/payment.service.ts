import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, In, Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { DateRange, PaymentMethodClassification } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';
import { AggregatedPayment } from '../reconciliation/types/interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  async findPosPayments(
    dateRange: DateRange,
    locations: LocationEntity[],
    statuses?: MatchStatus[]
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
          location_id: In(locations.map((location) => location.location_id)),
        },
        status: In(paymentStatuses),
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

  /**
   * findPosPaymentExceptions - Finds all payments to mark as exceptions
   * @param maxDate
   * @param location
   * @returns
   */
  public async findPosPaymentExceptions(
    maxDate: string,
    location: LocationEntity
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        transaction: {
          transaction_date: LessThan(maxDate),
          location_id: location.location_id,
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

  public aggregatePayments(payments: PaymentEntity[]): AggregatedPayment[] {
    const groupedPayments = payments.reduce(
      /*eslint-disable */
      (acc: any, payment: PaymentEntity) => {
        const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
        if (!acc[key]) {
          acc[key] = {
            status: payment.status,
            classification: payment.payment_method.classification,
            fiscal_close_date: payment.transaction.fiscal_close_date,
            amount: 0,
            payments: [],
          };
        }
        //TODO  I think we need to set the db precision to 2 decimal places to avoid this extra formatting??
        acc[key].amount += parseFloat(payment.amount.toFixed(2));
        acc[key].payments.push(payment);
        return acc;
      },
      {}
    );
    const aggPayments: AggregatedPayment[] = Object.values(groupedPayments);
    return aggPayments.sort(
      (a: AggregatedPayment, b: AggregatedPayment) => a.amount - b.amount
    );
  }

  public async findPaymentsForDailySummary(
    location: LocationEntity,
    date: string
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
          location_id: location.location_id,
          transaction_date: date,
        },
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
    location: LocationEntity,
    statuses?: MatchStatus[]
  ): Promise<PaymentEntity[]> {
    const paymentStatuses = statuses ? statuses : MatchStatusAll;
    const { minDate, maxDate } = dateRange;
    const payments = await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: In(paymentStatuses),
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: Raw(
            (alias) => `${alias} >= :minDate AND ${alias} <= :maxDate`,
            {
              minDate,
              maxDate,
            }
          ),
        },
      },
      relations: { transaction: true, payment_method: true },
      order: {
        transaction: { fiscal_close_date: 'ASC' },
        amount: 'ASC',
      },
    });

    return payments;
  }

  async getAggregatedPaymentsByCashDepositDates(
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<AggregatedPayment[]> {
    const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

    return this.aggregatePayments(
      await this.findCashPayments(dateRange, location, status)
    );
  }

  public async findPaymentsExceptions(
    location: LocationEntity,
    pastDueDepositDate: string
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: MatchStatus.IN_PROGRESS,
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: LessThanOrEqual(pastDueDepositDate),
        },
      },
      relations: {
        transaction: true,
        payment_method: true,
      },
    });
  }

  async findMatchedPosPayments(posDeposits: POSDepositEntity[]) {
    return await this.paymentRepo.find({
      where: { pos_deposit_match: In(posDeposits.map((itm) => itm.id)) },
    });
  }
  async updatePayments(payments: PaymentEntity[]): Promise<PaymentEntity[]> {
    return await this.paymentRepo.save(payments);
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
}
