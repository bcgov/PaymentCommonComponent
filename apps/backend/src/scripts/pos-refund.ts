import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  try {
    const posDepositService = app.get(PosDepositService);
    await posDepositService.adjustAmountsForRefundTransactions();
    appLogger.log('Adjusted POS refund amounts', POSDepositEntity);
  } catch (e) {
    appLogger.log(e);
  }
})();
