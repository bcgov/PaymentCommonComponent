import { NestFactory } from '@nestjs/core';
import { In, MoreThan } from 'typeorm';
import { AppModule } from '../app.module';
import { TransactionCode } from '../common/const';
import datasource from '../database/datasource';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { AppLogger } from '../logger/logger.service';
/**
 * Temp Script to fix current POS Refund Transactions
 */
(async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const posDepositRepo = datasource.getRepository(POSDepositEntity);
  try {
    const refundTransactions = await posDepositRepo.find({
      where: {
        transaction_code: In([
          TransactionCode.MERCH_RETURN,
          TransactionCode.PURCHASE_ADJUSTMENT
        ]),
        transaction_amt: MoreThan(0)
      }
    });

    for (const refundTransaction of refundTransactions) {
      refundTransaction.transaction_amt =
        refundTransaction.transaction_amt * -1;
      await posDepositRepo.save(refundTransaction);
    }
  } catch (e) {
    appLogger.log(e);
  }
})();
