import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, In, Repository, LessThanOrEqual } from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { DateRange, PaymentMethodClassification } from '../constants';
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
    date: string,
    location: LocationEntity,
    status?: MatchStatus
  ): Promise<PaymentEntity[]> {
    const paymentStatus = status ? status : In(MatchStatusAll);

    return await this.paymentRepo.find({
      where: {
        transaction: {
          transaction_date: date,
          location_id: location.location_id,
        },
        status: paymentStatus,
        payment_method: { classification: PaymentMethodClassification.POS },
      },
      relations: {
        payment_method: true,
        transaction: true,
      },
      order: {
        amount: 'ASC',
        payment_method: { method: 'ASC' },
        transaction: { transaction_time: 'ASC' },
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
    status?: MatchStatus[]
  ): Promise<PaymentEntity[]> {
    const paymentStatus = !status ? MatchStatusAll : status;
    const { from_date, to_date } = dateRange;
    const payments = await this.paymentRepo.find({
      where: {
        payment_method: { classification: PaymentMethodClassification.CASH },
        status: In(paymentStatus),
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: Raw(
            (alias) => `${alias} >= :from_date AND ${alias} <= :to_date`,
            {
              from_date: from_date,
              to_date: to_date,
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

  async updatePayments(payments: PaymentEntity[]): Promise<PaymentEntity[]> {
    return await Promise.all(
      payments.map(async (payment) => await this.updatePayment(payment))
    );
  }

  async updatePayment(payment: PaymentEntity): Promise<PaymentEntity> {
    return await this.paymentRepo.save(payment);
  }
}
