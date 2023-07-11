import { createNestApp } from './app.config';
import { natsLocalConnect } from './nats';
async function bootstrap() {
  const { app } = await createNestApp();
  const isLocalDev = process.env.RUNTIME_ENV === 'local';
  await app.init();
  if (isLocalDev) {
    await natsLocalConnect();
  }
}
bootstrap();
