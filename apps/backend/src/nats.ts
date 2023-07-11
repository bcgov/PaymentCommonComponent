import { connect, StringCodec } from 'nats';
import { handler } from './lambdas/parser';
/**
 * @description Used in local development in order to trigger the parse lambda whenever and object is dropped into the S3 (minio) bucket
 * TODO: integrate with filecheck/alert handler
 * TODO: test that all files from the prod S3 are parsed into the local db...NATS "at most one" delivery guarantee might be an issue - can use NATS jetstream to solve this
 */
export const natsLocalConnect = async () => {
  const nc = await connect({ servers: 'nats://localhost:4222' });
  const sc = StringCodec();
  const sub = nc.subscribe('bucketevents');

  (async () => {
    console.log(`...Waiting To Receive Messages...`);
    let count = 0;
    for await (const msg of sub) {
      const message = sc.decode(msg.data);
      const subject = msg.subject;

      console.log(`\nReceived message: #${count + 1} from ${subject}`);

      count++;
      const event = await JSON.parse(message);

      console.log(`\n...Parsing file: #${count}...\n`);

      const parse = await handler(event);
      console.log(parse);
      console.log(`\nDone file: #${count}\n`);

      // TODO after parse add filecheck/alert handler
      // TODO after filecheck/alert handler add reconcile handler
      // TODO after reconcile handler add report handler
      // return count

      //TODO: I don't think this is being called... investigate
    }
    console.log(`...Done....${count} messages processed`);
    await nc.drain();
  })();
};
