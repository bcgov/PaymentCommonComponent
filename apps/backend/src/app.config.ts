import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Documentation } from './common/documentation';
import { ErrorExceptionFilter } from './common/error-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';
import { API_PREFIX } from './config';
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
  const policies = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        imgSrc: `'self' data:`,
        scriptSrc: [`'self'`],
        styleSrc: [
          `'self'`,
          `'unsafe-hashes'`,
          `'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='`,
          `'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='`,
          `'sha256-eaPyLWVdqMc60xuz5bTp2yBRgVpQSoUggte1+40ONPU='`,
        ],
        fontSrc: [`'self'`],
      },
    },
  };

  const appLogger = new AppLogger();
  appLogger.setContext('App Logger');
  if (
    process.env.RUNTIME_ENV === 'local' ||
    process.env.RUNTIME_ENV === 'test'
  ) {
    app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    app.use(helmet(policies));
    app.useLogger(appLogger);
  } else {
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    app.use(helmet(policies));
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

  // Api prefix api/v1/
  app.setGlobalPrefix(API_PREFIX);

  Documentation(app);

  // Interceptor
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // Validation pipe
  app.useGlobalPipes(new TrimPipe(), new ValidationPipe(validationPipeConfig));

  // Global Error Filter
  app.useGlobalFilters(new ErrorExceptionFilter(app.get(AppLogger)));

  // TODO: verify if we need to add these headers or if they are included by default
  // Content Security Policy
  // Anti-clickjacking
  // Permissions Policy
  // Strict-Transport-Security
  // X-Content-Type-Options

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
