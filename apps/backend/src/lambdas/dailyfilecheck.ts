import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format, isSameDay, subDays } from 'date-fns';
import { ProgramTemplateName } from './const';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { AlertDestinationEntity } from '../notification/entities/alert-destination.entity';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';

const ALERT_EXPIRY_DAYS = 7; // Num days before we stop alerting for a LOB if they haven't submitted all files for a day

export const handler = async (event: unknown, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  appLogger.setContext('Daily File Check Lambda');
  const notificationService = app.get(NotificationService);
  const mailService = app.get(MailService);

  appLogger.log({ event });
  appLogger.log({ context });

  const date = new Date();

  // Retrieve statuses from the past 7 days
  const allRecentStatuses =
    await notificationService.retrieveRecentDailyStatuses(
      subDays(date, ALERT_EXPIRY_DAYS),
      new Date()
    );

  if (
    allRecentStatuses.filter((status) => isSameDay(status.created_at, date))
      .length === 0
  ) {
    // No files have been sent in today, skip alerting for off days
    // Assumption: At least one file upload should have arrived on time from any LOB
    return;
  }

  const rules = await notificationService.getAllRules();
  for (const rule of rules) {
    appLogger.log(
      `Checking recent statuses for rule ${rule.program} (${rule.id})`
    );
    const unsuccessfulStatuses = allRecentStatuses.filter(
      (status) => status.success === false && status.rule.id === rule.id
    );
    appLogger.log(
      `${unsuccessfulStatuses.length} unsuccessful days in the past ${ALERT_EXPIRY_DAYS} days`
    );

    // Alert - This program has files missing either today or in past days
    if (unsuccessfulStatuses.length > 0) {
      const earliestStatus = unsuccessfulStatuses[0]; // Query should be ordered by daily date
      const errors: string[] = [];
      const program =
        ProgramTemplateName[rule.program as keyof typeof ProgramTemplateName];

      const incompleteString = `Daily Upload for ${program} is incomplete for date: ${earliestStatus.dailyDate}.\n`;
      errors.push(incompleteString);

      const missingFiles = notificationService.findMissingDailyFiles(
        rule,
        earliestStatus.files
      );
      missingFiles.forEach((file) => {
        errors.push(`Missing a ${file.fileType} - needs ${file.filename}\n`);
      });

      appLogger.log(errors.join(' '));
      const alertDestinationEntities: AlertDestinationEntity[] =
        await mailService.getAlertDestinations(
          program,
          missingFiles.map((mf) => mf.filename)
        );

      const alertDestinations = alertDestinationEntities.map(
        (itm) => itm.destination
      );

      if (!alertDestinations.length || !program) {
        continue;
      }

      appLogger.log('\n\n=========Alerts Sent for Daily Upload: =========\n');
      appLogger.error(
        `Sending an alert to prompt ${program} to complete upload`
      );
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
  }
};
