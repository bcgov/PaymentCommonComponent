import { NestFactory } from '@nestjs/core';
import { Context, Handler } from 'aws-lambda';
import { consumerOpts, createInbox } from 'nats';
import { ConsumerOptsBuilderImpl } from 'nats/lib/nats-base-client/jsconsumeropts';
import { Nats } from 'src/nats/nats.service';
import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logger.service';

/**
 * Design this function to trigger existing NestJs appliation services without Api-Getway
 * All the schedule and backgroud job trigger will be added here.
 */
export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const natsStream: Nats = app.get('NATS_CONNECTION');
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });
  const SUBJECT = 'lob1.*';
  try {
    const sub = await natsStream.subscribeToEventPatterns(SUBJECT);
    const done = (async () => {
      for await (const message of sub) {
        try {
          const decoded:any = natsStream.codec.decode(message.data);
          appLogger.log(`subject:${message.subject}, message: ${JSON.stringify(decoded)}`);
          message.ack();
        } catch {
          message.term();
        }
      }
    })();
  } catch (e) {
    appLogger.error(e);
  }
};

handler();
