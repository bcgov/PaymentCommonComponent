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
 * Opertion like sync data, update database view or trigger db function, etc.
 */
export const handler: Handler = async (event, context: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const natsService: Nats = app.get('NATS_CONNECTION');
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });
  const SUBJECT = 'hello';
  try {
    const options = consumerOpts() as ConsumerOptsBuilderImpl;
    options.durable('me');
    options.manualAck();
    options.ackExplicit();
    options.deliverTo(createInbox());
    options.stream = 's1';
    const sub = await natsService.subscribeToEventPatterns(SUBJECT, options);

    const done = (async () => {
      for await (const message of sub) {
        try {
          const decoded = natsService.codec.decode(message.data);
          appLogger.log(`subject:${message.subject}, message: ${decoded}`);
          message.working();
    
          message.ack();
        } catch {
          message.term();
        }
      }
    })();

    // when done (by some logic not shown here), you can delete
    // the consumer by simply calling `destroy()`. Destroying
    // a consumer removes all its state information.
    sub.destroy();
  } catch (e) {
    appLogger.error(e);
  }
};

handler();
