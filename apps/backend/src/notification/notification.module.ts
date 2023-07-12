import { Logger, Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService, Logger],
  exports: [MailService],
})
export class NotificationModule {}
