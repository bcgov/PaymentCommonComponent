import { NestFactory } from '@nestjs/core';
import { S3Event, Context, S3EventRecord } from 'aws-lambda';
import { format } from 'date-fns';
import { ReconciliationEventMessage } from './interface';
import { AppModule } from '../app.module';
import { Ministries, S3File } from '../constants';

import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { ParseService } from '../parse/parse.service';
import { UploadService } from '../parse/upload.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';

export const handler = async (event: S3Event, _context?: Context) => {
  const automationDisabled =
    process.env.DISABLE_AUTOMATED_RECONCILIATION === 'true';

  const isLocal: boolean = process.env.RUNTIME_ENV === 'local';

  const app = await NestFactory.createApplicationContext(AppModule);
  const uploadService = app.get(UploadService);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  const snsService = app.get(SnsManagerService);
  const notificationService = app.get(NotificationService);

  appLogger.setContext('Parser Lambda');
  appLogger.log({ event, _context });

  // TODO make the ministry-client configurable
  const triggerReconcileSnsMessage = async () => {
    // sends a message via SNS to trigger the reconciliation lambda
    const message: ReconciliationEventMessage = {
      program: Ministries.SBC,
      reportEnabled: true,
      byPassFileValidity: false,
      reconciliationMaxDate: format(new Date(), 'yyyy-MM-dd'),
    };

    // only publish to SNS if not local and automation is not disabled
    if (!isLocal && !automationDisabled) {
      appLogger.log('Publishing SNS to reconcile');
      // specify the topic to publish to in aws
      const topic = process.env.SNS_TRIGGER_RECONCILIATION_TOPIC_ARN;

      await snsService.publish(topic, JSON.stringify(message));
    }
  };

  // if local, get the list of files from the s3 bucket
  // otherwise, get the list of files from the event
  const fileList: string[] =
    process.env.RUNTIME_ENV === 'local'
      ? await uploadService.checkS3ForFiles()
      : event.Records.map((r: S3EventRecord) => r.s3.object.key);

  // filter out any files that have already been parsed
  const filteredParseList: string[] =
    await uploadService.filterDuplicateFileList(fileList);

  // get the rules for each ministry-client
  const programRules: FileIngestionRulesEntity[] =
    await notificationService.getAllRules();

  // validate the fileList against the rules
  // get the file objects and metadata for each file
  const finalParseList: S3File[] = await uploadService.getFileObjectAndMetadata(
    filteredParseList,
    programRules
  );

  try {
    // iterate through the list of files and parse each one
    for (const file of finalParseList) {
      await parseService.parseFile(file);
    }

    appLogger.log(`Attempted to parse ${finalParseList.length} files`);
    // trigger reconciliation

    await triggerReconcileSnsMessage();
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
