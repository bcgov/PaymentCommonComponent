import { NestFactory } from '@nestjs/core';
import { Context, Handler } from 'aws-lambda';
import { Nats } from 'src/nats/nats.service';
import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logger.service';

/**
 * Design this function to trigger existing NestJs appliation services without Api-Getway
 * All the schedule and backgroud job trigger will be added here.
 * Opertion like sync data, update database view or trigger db function, etc.
 */
export const handler: Handler = async (event, context: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const natsStream: Nats = app.get('NATS_CONNECTION');
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });
  try {
    appLogger.log('Send it..');
    const pa = await natsStream.publish('hello', 'TEST_MESSAGE', {expect: {streamName: 's1'}});
    console.log(pa);
  } catch (e) {
    appLogger.error(e);
  }
  await natsStream.close();
  appLogger.log('...end session hererere');
};

handler();
