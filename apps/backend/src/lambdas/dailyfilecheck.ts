import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format } from 'date-fns';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';

export const handler = async (event: unknown, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const notificationService = app.get(NotificationService);
  const mailService = app.get(MailService);
  appLogger.log({ event });
  appLogger.log({ context });

  try {
    // const alertsSentResponse = await axiosInstance.post(
    //   '/v1/parse/daily-upload/alert',
    //   {
    //     date: new Date(),
    //   },
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // );
    // this.appLogger.log(alertsSentResponse.data.data);
    // const alertsSent: DailyAlertRO = alertsSentResponse.data.data;
    const alertsSent = await notificationService.dailyUploadAlert(
      format(new Date(), 'yyyy-MM-dd')
    );

    const programAlerts = alertsSent.dailyAlertPrograms;
    for (const alert of programAlerts) {
      const errors: string[] = [];
      if (!alert.success) {
        const incompleteString = `Daily Upload for ${alert.program} is incomplete.`;
        errors.push(incompleteString);
        alert.missingFiles.forEach((file) => {
          errors.push(
            `Missing a ${file.fileType} file - needs file name "${file.filename}"`
          );
        });
      }

      appLogger.log(errors.join(' '));
      if (alert.alerted) {
        const alertDestinations = await mailService.getAlertDestinations(
          alert.program,
          alert.missingFiles.map((mf) => mf.filename)
        );
        if (!alertDestinations.length) {
          continue;
        }
        appLogger.log('\n\n=========Alerts Sent for Daily Upload: =========\n');
        appLogger.error(
          `Sent an alert to prompt ${alert.program} to complete upload`
        );
        await mailService.sendEmailAlertBulk(
          MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
          alertDestinations.map((ad) => ad),
          [
            {
              fieldName: 'date',
              content: format(new Date(), 'yyyy-MM-dd'),
            },
            {
              fieldName: 'ministryDivision',
              content: alert.program,
            },
            {
              fieldName: 'error',
              content: errors.join(' '),
            },
          ]
        );
      }
    }
    //TODO trigger reconciliation if has all files
    //TO DO -- remove this -- this is just for testing
    return { message: 'alerts sent', stausCode: 200, status: 'success' };
  } catch (err) {
    appLogger.error(err);
  }
};
