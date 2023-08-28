import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import express from 'express';

import { AppModule } from './app.module';
import { Documentation } from './common/documentation';
import { ErrorExceptionFilter } from './common/error-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';
import { DatabaseService } from './database/database.service';
import { AppLogger } from './logger/logger.service';
import { TrimPipe } from './trim.pipe';

interface ValidationErrorMessage {
  property: string;
  errors: string[];
}

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: false,
  enableDebugMessages: false,
  disableErrorMessages: true,
  exceptionFactory: (errors) => {
    const getErrorMessages = (
      error: ValidationError
    ): ValidationErrorMessage[] => {
      const messages: ValidationErrorMessage[] = [];
      if (error.constraints) {
        messages.push({
          property: error.property,
          errors: Object.values(error.constraints),
        });
      }
      if (error.children && error.children?.length > 0) {
        messages.push(
          ...error.children
            .map(getErrorMessages)
            .reduce((a, c) => a.concat(c), [])
        );
      }
      return messages;
    };
    const errorMessages = errors.map((error) => getErrorMessages(error));
    throw new BadRequestException(errorMessages);
  },
};

export async function createNestApp(): Promise<{
  app: NestExpressApplication;
  expressApp: express.Application;
}> {
  // Express app
  const expressApp = express();
  expressApp.disable('x-powered-by');

  // Nest Application With Express Adapter
  let app: NestExpressApplication;
  const appLogger = new AppLogger();
  appLogger.setContext('App Logger');
  if (
    process.env.RUNTIME_ENV === 'local' ||
    process.env.RUNTIME_ENV === 'test'
  ) {
    app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    app.useLogger(appLogger);
  } else {
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    app.useLogger(appLogger);
  }
  const seedData = app.get(DatabaseService);
  try {
    await seedData.seedMasterData();
  } catch (e) {
    app.useLogger(appLogger);
    appLogger.log(e);
  } finally {
    app.close();
  }

  // Validation pipe
  app.useGlobalPipes(new TrimPipe(), new ValidationPipe(validationPipeConfig));

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: process.env.APP_VERSION,
  });

  Documentation(app);

  // Interceptor
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // Validation pipe
  app.useGlobalPipes(new TrimPipe(), new ValidationPipe(validationPipeConfig));

  // Global Error Filter
  app.useGlobalFilters(new ErrorExceptionFilter(app.get(AppLogger)));

  // Printing the environment variables
  // eslint-disable-next-line no-console
  console.table({
    project: process.env.PROJECT,
    envName: process.env.ENV_NAME,
    nodeEnv: process.env.NODE_ENV,
    runtimeEnv: process.env.RUNTIME_ENV,
    alertsEnabled: Boolean(false),
  });

  return {
    app,
    expressApp,
  };
}
