import { Logger } from '@nestjs/common/services';
import { NestExpressApplication } from '@nestjs/platform-express';
import { connect, StringCodec } from 'nats';
import { handler } from './lambdas/parser';
/**
 * @description Used in local development in order to trigger the parse lambda whenever and object is dropped into the S3 (minio) bucket
 * TODO: integrate with filecheck/alert handler
 * TODO: test that all files from the prod S3 are parsed into the local db...NATS "at most one" delivery guarantee might be an issue - can use NATS jetstream to solve this
 */
export const natsLocalConnect = async (app: NestExpressApplication) => {
  const nc = await connect({ servers: 'nats://localhost:4222' });
  const sc = StringCodec();
  const sub = nc.subscribe('bucketevents');
  const logger = app.get(Logger);
  (async () => {
    for await (const msg of sub) {
      console.log(`${sc.decode(msg.data)} on subject ${msg.subject}`);
      const event = JSON.parse(sc.decode(msg.data));
      try {
        await handler(event);
        // TODO after parse add filecheck/alert handler
        // TODO after filecheck/alert handler add reconcile handler
        // TODO after reconcile handler add report handler
      } catch (err) {
        logger.error(err);
        return err;
      }
    }
    await nc.drain();
  })();
};
