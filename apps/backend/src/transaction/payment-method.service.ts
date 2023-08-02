import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodEntity } from './entities';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class PaymentMethodService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepo: Repository<PaymentMethodEntity>
  ) {}

  async getPaymentMethods(): Promise<PaymentMethodEntity[]> {
    return await this.paymentMethodRepo.find();
  }

  async seedPaymentMethods(
    paymentMethodsData: PaymentMethodEntity[]
  ): Promise<void> {
    this.appLogger.log('Seeding payment methods', PaymentMethodService.name);
    await this.paymentMethodRepo.save(
      this.paymentMethodRepo.create(paymentMethodsData)
    );
  }
}
