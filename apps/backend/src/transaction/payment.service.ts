import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { LessThan, MoreThan, Not, In, Raw, Repository } from 'typeorm';
import { PaymentEntity } from './entities';
import { ReconciliationEvent } from '../reconciliation/types';
import { AggregatedPayment } from '../reconciliation/types/interface';
import { MatchStatus } from './../common/const';
import { POSDepositEntity } from './../deposits/entities/pos-deposit.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>
  ) {}

  async findPosPayments(event: ReconciliationEvent): Promise<PaymentEntity[]> {
    const pos_payment_methods = ['AX', 'V', 'P', 'M'];
    const {
      location: { location_id },
      date
    } = event;

    return await this.paymentRepo.find({
      where: {
        transaction: { transaction_date: date, location_id },
        method: In(pos_payment_methods)
      },
      relations: ['transaction'],
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
        const key = `date:_${payment.transaction.fiscal_close_date}_for_${payment.transaction.location_id}`;
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

  public async findCashPayments(
    event: ReconciliationEvent,
    current: string,
    previous: string
  ): Promise<AggregatedPayment[]> {
    const {
      location: { location_id }
    } = event;
    const pos_methods = ['AX', 'P', 'V', 'M'];

    if (!previous) {
      return [];
    }
    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        amount: MoreThan(0.0),
        status: In([MatchStatus.PENDING, MatchStatus.IN_PROGRESS]),
        transaction: {
          location_id,
          fiscal_close_date: Raw(
            (alias) =>
              `${alias} < :current::date AND ${alias} >= :previous::date`,
            { current, previous }
          )
        }
      },
      relations: ['transaction'],
      order: {
        transaction: {
          location_id: 'ASC',
          fiscal_close_date: 'DESC'
        }
      }
    });
    return this.aggregatePayments(payments);
  }
  public async findPaymentsExceptions(
    event: ReconciliationEvent,
    pastDueDepositDate: string
  ) {
    const {
      location: { location_id }
    } = event;
    const pos_methods = ['AX', 'P', 'V', 'M'];
    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        amount: MoreThan(0.0),
        status: MatchStatus.PENDING || MatchStatus.IN_PROGRESS,
        transaction: {
          location_id,
          fiscal_close_date: LessThan(
            format(new Date(pastDueDepositDate), 'yyyy-MM-dd')
          )
        }
      },
      relations: ['transaction'],
      order: {
        transaction: {
          location_id: 'ASC',
          fiscal_close_date: 'DESC'
        }
      }
    });
    return payments;
  }
  public async findCashPaymentExceptions(
    event: ReconciliationEvent,
    current: string,
    previous: string
  ): Promise<PaymentEntity[]> {
    const {
      location: { location_id }
    } = event;
    const pos_methods = ['AX', 'P', 'V', 'M'];

    if (!previous) {
      return [];
    }
    const payments = await this.paymentRepo.find({
      where: {
        method: Not(In(pos_methods)),
        amount: MoreThan(0.0),
        transaction: {
          location_id,
          fiscal_close_date: Raw(
            (alias) =>
              `${alias} < '${current}'::date AND ${alias} >= '${previous}'::date`
          )
        }
      },
      relations: ['transaction'],
      order: {
        transaction: {
          location_id: 'ASC',
          fiscal_close_date: 'DESC'
        }
      }
    });
    return payments;
  }

  //TODO Error handling?
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
      pos_deposit_id: deposit
    });
  }

  async updatePayment(payment: PaymentEntity): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });
    return await this.paymentRepo.save({
      ...paymentEntity,
      ...payment
    });
  }
}
