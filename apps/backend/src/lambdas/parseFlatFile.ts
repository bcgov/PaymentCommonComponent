import { BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { parseTDI } from './utils/parseTDI';
import { AppModule } from '../app.module';
import { FileTypes } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

export interface parseFlatFileEvent {
  type: FileTypes;
  program: string;
  filepath: string;
  filename: string;
  outputPath: string;
}

export const handler = async (event: parseFlatFileEvent, context?: Context) => {
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

    const contents = await s3manager.getObject(
      `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
      `${event.filepath}`
    );

    await uploadParsedTDI(
      event.type,
      s3manager,
      parseTDI({
        type: event.type,
        fileContents: contents?.Body?.toString() || '',
        program: event.program,
        fileName: event.filename,
      }),
      appLogger,
      event?.outputPath ?? undefined
    );
  } catch (e) {
    appLogger.error(e);
  }
};

export const uploadParsedTDI = async (
  type: string,
  s3manager: S3ManagerService,
  output: unknown,
  appLogger: AppLogger,
  outputPath?: string
) => {
  try {
    await s3manager.putObject(
      `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
      outputPath ?? `outputs/${type}/${Date.now()}_${type}.json`,
      Buffer.from(JSON.stringify(output))
    );
  } catch (e) {
    appLogger.error(e);
  }
};
