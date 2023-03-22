import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, LessThan, Not, In, Repository } from 'typeorm';
import { PaymentEntity } from './entities';
import { MatchStatus, MatchStatusAll } from '../common/const';
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
        const key = `${payment.transaction.fiscal_close_date}`;
        if (!acc[key]) {
          acc[key] = {
            status: payment.status,
            fiscal_close_date: payment.transaction.fiscal_close_date,
            location_id: payment.transaction.location_id,
            amount: 0,
            payments: []
          };
        }
        acc[key].amount += payment.amount;
        acc[key].payments.push(payment);
        return acc;
      },
      {}
    );

    const result = Object.values(groupedPayments);
    return result as AggregatedPayment[];
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
    currentDate: string,
    pastDueDate: string,
    location: LocationEntity,
    status: MatchStatus
  ): Promise<PaymentEntity[]> {
    const pos_methods = ['AX', 'P', 'V', 'M'];
    const paymentStatus =
      status === MatchStatus.ALL ? In(MatchStatusAll) : status;

    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        status: paymentStatus,
        transaction: {
          location_id: location.location_id,
          fiscal_close_date: Raw(
            (alias) => `${alias} >= :pastDueDate AND ${alias} <= :currentDate`,
            { pastDueDate, currentDate }
          )
        }
      },
      relations: ['transaction', 'payment_method'],
      order: {
        transaction: { fiscal_close_date: 'DESC' },
        amount: 'DESC'
      }
    });

    return payments;
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

  //TODO [CCFPCM-406] Error handling?
  async markPosPaymentsAsMatched(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });

    return await this.paymentRepo.save({
      ...paymentEntity,
      status: MatchStatus.MATCH,
      pos_deposit_match: deposit
    });
  }

  async updatePayments(
    payments: PaymentEntity[],
    status: MatchStatus
  ): Promise<PaymentEntity[]> {
    this.appLogger.log(
      `UPDATED: ${payments.length} PAYMENTS to ${status.toUpperCase()}`,
      PaymentService.name
    );

    return await Promise.all(
      payments.map(
        async (payment) =>
          await this.updatePayment({
            ...payment,
            timestamp: payment.timestamp,
            status
          })
      )
    );
  }

  async updatePayment(payment: PaymentEntity): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });
    return await this.paymentRepo.save({ ...paymentEntity, ...payment });
  }
}
