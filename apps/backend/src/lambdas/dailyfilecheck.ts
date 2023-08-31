import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format, isSameDay, subDays } from 'date-fns';
import { ProgramTemplateName } from './const';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';

const ALERT_EXPIRY_DAYS = 7; // Num days before we stop alerting for a LOB if they haven't submitted all files for a day

export const handler = async (event: unknown, context?: Context) => {
  const sendMissingFilesEmail = async (
    program: string,
    destinations: string[],
    errorsMessage: string
  ) => {
    appLogger.log('Daily file check showing errors:');
    appLogger.log(errorsMessage);

    appLogger.log('\n\n=========Alerts Sent for Daily Upload: =========\n');
    appLogger.error(`Sending an alert to prompt ${program} to complete upload`);

    await mailService.sendEmailAlertBulk(
      MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
      destinations,
      [
        {
          fieldName: 'date',
          content: format(new Date(), 'MMM do, yyyy'),
        },
        {
          fieldName: 'ministryDivision',
          content: `${
            process.env.RUNTIME_ENV !== 'production' &&
            `[${process.env.RUNTIME_ENV}] `
          }${program}`,
        },
        {
          fieldName: 'error',
          content: errorsMessage,
        },
      ]
    );
  };

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
    appLogger.log('No uploads today, we will not send out any alerts');
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

    const allMissingFiles: ProgramRequiredFileEntity[] = [];
    unsuccessfulStatuses.forEach((st) => {
      const mfiles = notificationService.findMissingDailyFiles(rule, st.files);
      allMissingFiles.push(...mfiles);
    });

    if (unsuccessfulStatuses.length > 0) {
      const program =
        ProgramTemplateName[rule.program as keyof typeof ProgramTemplateName];
      if (!program) {
        continue;
      }

      const allAlertDestinations = await mailService.getAlertDestinations(
        program,
        allMissingFiles.map((mf) => mf.filename)
      );

      // Send a summary to destinations with 'ALL' and 'RULE' of all missing files
      const ruleDestinations = allAlertDestinations.filter(
        (ad) => ad.allAlerts || ad.rule?.id === rule.id
      );
      const ruleErrors: string[] = [];
      for (const status of unsuccessfulStatuses) {
        const incompleteString = `Daily Upload for ${program} is incomplete for date: ${status.dailyDate}.\n`;
        ruleErrors.push(incompleteString);
        const missingFiles = notificationService.findMissingDailyFiles(
          rule,
          status.files
        );

        // For each missing file, send an email to destinations that point to the specific filetype
        const fileErrors: string[] = [];
        missingFiles.map(async (file) => {
          const fileAlertDestinations = allAlertDestinations.filter(
            (ad) => ad.requiredFile?.id === file.id
          );
          if (fileAlertDestinations.length > 0) {
            fileErrors.push(incompleteString);
            fileErrors.push(
              `Missing a ${file.fileType} - needs ${file.filename}\n`
            );
            await sendMissingFilesEmail(
              program,
              fileAlertDestinations.map((ad) => ad.destination),
              fileErrors.join(' ')
            );
          }

          // Add this missing file string to the more general rule / all error message
          ruleErrors.push(
            `Missing a ${file.fileType} - needs ${file.filename}\n`
          );
        });
      }
      await sendMissingFilesEmail(
        program,
        ruleDestinations.map((ad) => ad.destination),
        ruleErrors.join(' ')
      );
    }
  }
};
