import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format, isSameDay, parse, subDays } from 'date-fns';
import { ProgramTemplateName } from './const';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { AlertDestinationEntity } from '../notification/entities/alert-destination.entity';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';

export const handler = async (event: unknown, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = new AppLogger();
  appLogger.setContext('Daily File Check Lambda');
  const notificationService = app.get(NotificationService);
  const mailService = app.get(MailService);

  appLogger.log({ event });
  appLogger.log({ context });

  const date = new Date();

  // Retrieve statuses from the past 7 days
  const allRecentStatuses =
    await notificationService.retrieveRecentDailyStatuses(
      subDays(date, 7),
      new Date()
    );

  if (
    allRecentStatuses.filter((status) =>
      isSameDay(parse(status.dailyDate, 'yyyy-MM-dd', new Date()), date)
    ).length === 0
  ) {
    // No files today, skip alerting for off days
    // Assumption: At least one file upload should have arrived on time
    return;
  }

  const rules = await notificationService.getAllRules();
  for (const rule of rules) {
    const unsuccessfulStatuses = allRecentStatuses.filter(
      (status) => status.success === false && status.rule.id === rule.id
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
  }
};
