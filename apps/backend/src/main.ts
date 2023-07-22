import { createNestApp } from './app.config';
import { natsLocalConnect } from './nats';

async function bootstrap() {
  const { app } = await createNestApp();
  app.enableCors();
  await app.init();
  

  const isLocalDev = process.env.RUNTIME_ENV === 'local';
  if (isLocalDev) {
    await natsLocalConnect();
  }
  await app.listen(process.env.APP_PORT || 3000);    
}
bootstrap();
