import { Module } from '@nestjs/common';
import { Subscription } from 'nats';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { Nats } from './nats/nats.service';

@Module({
  imports: [Nats],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    Nats,
    {
      provide: 'NATS_CONNECTION',
      useFactory: async (): Promise<Nats> => {
        const natsConnection = new Nats({
          connection: { servers: ['nats://localhost:4222'] },
          streams: [{
            name: 's1',
            subjects: ['hello']
          },
          {
            name: 'sales',
            subjects: ['sales*']
          }
        ]
        });
        await natsConnection.connect();
        return natsConnection;
      },
      inject: [Nats],
    },
  ],
})
export class AppModule {}
