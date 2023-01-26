import { BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { parseGarms } from './utils/parseGarms';

export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const s3manager = app.get(S3ManagerService);

  appLogger.log({ event });
  appLogger.log({ context });

  if (!event.type || !event.filepath) {
    throw new BadRequestException();
  }
  try {
    appLogger.log(`...start ${event.type} Parsing`);

    const contents = await s3manager.getContents(
      `pcc-integration-data-files-${process.env.NODE_ENV}`,
      `${event.filepath}`
    );

    await uploadParsedGarms(
      event.type,
      s3manager,
      parseGarms(JSON.parse(contents?.Body?.toString() || '')),
      appLogger,
      event?.outputPath ?? undefined
    );
  } catch (e) {
    appLogger.error(e);
  }
};

export const uploadParsedGarms = async (
  type: string,
  s3manager: S3ManagerService,
  output: unknown,
  appLogger: AppLogger,
  outputPath?: string
) => {
  try {
    await s3manager.putObject(
      `pcc-integration-data-files-${process.env.NODE_ENV}`,
      outputPath ?? `outputs/${type}/${Date.now()}_${type}.json`,
      Buffer.from(JSON.stringify(output))
    );
  } catch (e) {
    appLogger.error(e);
  }
};
