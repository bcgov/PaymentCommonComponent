import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, LessThan, Not, In, Repository } from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
import { DateRange } from '../constants';
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
    const pos_payment_methods = ['AX', 'V', 'P', 'M'];
    const paymentStatus = status ? status : In(MatchStatusAll);

    return await this.paymentRepo.find({
      where: {
        transaction: {
          transaction_date: date,
          location_id: location.location_id
        },
        status: paymentStatus,
        method: In(pos_payment_methods)
      },
      relations: ['transaction', 'payment_method'],
      order: {
        amount: 'ASC',
        method: 'ASC',
        transaction: { transaction_time: 'ASC' }
      }
    });
  }

  aggregatePayments(payments: PaymentEntity[]): AggregatedPayment[] {
    const groupedPayments = payments.reduce(
      /*eslint-disable */
      (acc: any, payment: PaymentEntity) => {
        const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
        if (!acc[key]) {
          acc[key] = {
            status: payment.status,
            fiscal_close_date: payment.transaction.fiscal_close_date,
            amount: 0,
            payments: []
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

  public async findPaymentsWithPartialSelect(
    location: LocationEntity,
    date: string
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      select: {
        amount: true,
        method: true,
        status: true,
        transaction: {
          transaction_date: true,
          location_id: true
        }
      },
      where: {
        transaction: {
          location_id: location.location_id,
          transaction_date: date
        }
      }
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
    const pos_methods = ['AX', 'P', 'V', 'M'];
    const paymentStatus = !status ? MatchStatusAll : status;
    const { from_date, to_date } = dateRange;
    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        status: In(paymentStatus),
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: Raw(
            (alias) => `${alias} >= :from_date AND ${alias} <= :to_date`,
            { from_date, to_date }
          )
        }
      },
      relations: ['transaction', 'payment_method'],
      order: {
        transaction: { fiscal_close_date: 'ASC' },
        amount: 'ASC'
      }
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
  ) {
    const pos_methods = ['AX', 'P', 'V', 'M'];
    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        status: In([MatchStatus.PENDING, MatchStatus.IN_PROGRESS]),
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: LessThan(pastDueDepositDate)
        }
      },
      relations: ['transaction']
    });
    return payments;
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
