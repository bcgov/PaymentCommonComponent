import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodEntity } from './entities';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepo: Repository<PaymentMethodEntity>,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(PaymentMethodService.name);
  }

  async getPaymentMethods(): Promise<PaymentMethodEntity[]> {
    return await this.paymentMethodRepo.find();
  }

  async createPaymentMethods(
    paymentMethodsData: PaymentMethodEntity[]
  ): Promise<void> {
    this.appLogger.log('Seeding payment methods');
    await this.paymentMethodRepo.save(
      this.paymentMethodRepo.create(paymentMethodsData)
    );
  }
}
