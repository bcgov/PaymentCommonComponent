import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format } from 'date-fns';
import { ProgramTemplateName } from './const';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { AlertDestinationEntity } from '../notification/entities/alert-destination.entity';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';
import { DailyAlertRO } from '../parse/ro/daily-alert.ro';

export const handler = async (event: unknown, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const notificationService = app.get(NotificationService);
  const mailService = app.get(MailService);

  appLogger.log({ event });
  appLogger.log({ context });

  const date = format(new Date(), 'yyyy-MM-dd');

  const dailyAlert: DailyAlertRO = await notificationService.dailyUploadAlert(
    date
  );

  const programAlerts = dailyAlert.dailyAlertPrograms;

  for (const alert of programAlerts) {
    const errors: string[] = [];
    const program =
      ProgramTemplateName[alert.program as keyof typeof ProgramTemplateName];

    if (!alert.success) {
      const incompleteString = `Daily Upload for ${program} is incomplete.\n`;
      errors.push(incompleteString);
      alert.missingFiles.forEach((file) => {
        errors.push(`Missing a ${file.fileType} - needs ${file.filename}\n`);
      });
    }

    appLogger.log(errors.join(' '));
    if (alert.alerted) {
      const alertDestinationEntities: AlertDestinationEntity[] =
        await mailService.getAlertDestinations(
          alert.program,
          alert.missingFiles.map((mf) => mf.filename)
        );

      const alertDestinations = alertDestinationEntities.map(
        (itm) => itm.destination
      );

      if (!alertDestinations.length) {
        continue;
      }

      appLogger.log('\n\n=========Alerts Sent for Daily Upload: =========\n');
      appLogger.error(`Sent an alert to prompt ${program} to complete upload`);
      await mailService.sendEmailAlertBulk(
        MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
        alertDestinations.map((ad) => ad),
        [
          {
            fieldName: 'date',
            content: format(new Date(), 'MMM do, yyyy'),
          },
          {
            fieldName: 'ministryDivision',
            content: program,
          },
          {
            fieldName: 'error',
            content: errors.join(' '),
          },
        ]
      );
    }
    return { message: 'alerts sent', stausCode: 200, status: 'success' };
  }
};
