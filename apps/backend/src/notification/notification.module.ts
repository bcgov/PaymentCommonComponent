import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { AlertDestinationEntity } from './entities/alert-destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlertDestinationEntity])],
  providers: [MailService, Logger],
  exports: [MailService],
})
export class NotificationModule {}
