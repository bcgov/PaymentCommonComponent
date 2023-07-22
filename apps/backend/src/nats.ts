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
    

  //   const timer = setTimeout(async ()=>     {
  //   console.log(`...Done....${count} messages processed`)
  //   await nc.drain()
  // }, 10000)

    for await (const msg of sub) {
      // timer.refresh()
      const message = sc.decode(msg.data);
      const subject = msg.subject;
      
      console.log(`\nReceived message: #${count + 1} from ${subject}`);

      count++;
      const event = await JSON.parse(message);

      console.log(`\n...Parsing file: #${count}...\n`);
      
      await handler(event);

      console.log(`\nDone file: #${count}\n`);   
    }
    console.log(`...Done....${count} messages processed`);
    await nc.drain();
  })();
};
