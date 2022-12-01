import { BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TDI17Details, TDI34Details, DDFDetails } from '../flat-files-to-json';

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
      `bc-pcc-data-files-${process.env.NODE_ENV}`,
      `${event.filepath}`
    );

    await uploadParsedTDI(
      event.type,
      s3manager,
      parseTDI(event.type, contents?.Body?.toString()),
      appLogger,
      event?.outputPath ?? undefined
    );
  } catch (e) {
    appLogger.error(e);
  }
};

const parseTDI = (type: string, fileContents?: string) => {
  const lines = fileContents?.split('\n').filter((l: string) => l);
  lines?.splice(0, 1);
  lines?.splice(lines.length - 1, 1);

  const detailsArr: (TDI34Details | TDI17Details | DDFDetails)[] | undefined =
    lines &&
    lines.map((line: string) => {
      const details =
        type === 'DDF'
          ? new DDFDetails({})
          : type === 'TDI17'
          ? new TDI17Details({})
          : new TDI34Details({});
      details.convertToJson(line);
      console.log(details, 'details');
      return details;
    });

  return {
    details: detailsArr?.map((itm: { resource: unknown }) => itm.resource)
  };
};

const uploadParsedTDI = async (
  type: string,
  s3manager: S3ManagerService,
  output: unknown,
  appLogger: AppLogger,
  outputPath?: string
) => {
  try {
    await s3manager.putObject(
      `bc-pcc-data-files-${process.env.NODE_ENV}`,
      outputPath ?? `outputs/${type}/${Date.now()}_${type}.json`,
      Buffer.from(JSON.stringify(output))
    );
  } catch (e) {
    appLogger.error(e);
  }
};
