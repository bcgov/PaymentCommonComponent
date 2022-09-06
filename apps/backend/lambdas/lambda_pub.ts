import { NestFactory } from '@nestjs/core';
import { Context, Handler } from 'aws-lambda';
import { Nats } from 'apps/backend/src/nats/nats.service';
import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logger.service';

/**
 * Design this function to trigger existing NestJs appliation services without Api-Getway
 * All the schedule and backgroud job trigger will be added here.
 */
export const handler = async (event?:any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const natsStream: Nats = app.get('NATS_CONNECTION');
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });
  try {
    appLogger.log('Send it..');
    const pa = await natsStream.publish(
      'sales.processed',
      {
        datetime: new Date().toTimeString(),
        amount: '$736.95',
        method: 'cash',
        serviceCode: 'cupidatat',
        item: 'item1',
      },
      { expect: { streamName: 'sales' } },
    );
  } catch (e) {
    appLogger.error(e);
  }
  await natsStream.close();
  appLogger.log('...end session hererere');
};

handler();
