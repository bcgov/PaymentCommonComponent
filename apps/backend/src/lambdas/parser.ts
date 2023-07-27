import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { handler as reconcileHandler } from './reconcile';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';

const API_URL = process.env.API_URL;

// let axiosInstance: AxiosInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  const snsService = app.get(SnsManagerService);
  const isLocal = process.env.RUNTIME_ENV === 'local';
  appLogger.log({ event, _context }, 'PARSE EVENT');

  if (!API_URL) {
    appLogger.error(
      'No API URL present, please check the environment variables'
    );
    return;
  } else {
    // axiosInstance = axios.create({ baseURL: API_URL });
  }

  try {
    await parseService.processAllFiles(event);
    if (isLocal) {
      await reconcileHandler(
        {
          Records: [
            {
              EventVersion: '',
              EventSubscriptionArn: '',
              EventSource: '',
              Sns: {
                Message: '{}',
                MessageId: '',
                MessageAttributes: {},
                Type: '',
                TopicArn: '',
                Subject: '',
                UnsubscribeUrl: '',
                SignatureVersion: '',
                Timestamp: new Date().toISOString(),
                Signature: '',
                SigningCertUrl: '',
              },
            },
          ],
        },
        _context
      );
    } else {
      const SNS_PARSER_RESULTS_TOPIC = process.env.SNS_PARSER_RESULTS_TOPIC;
      const response: SNS.Types.PublishResponse = await snsService.publish(
        SNS_PARSER_RESULTS_TOPIC || '',
        '{}'
      );
      return {
        success: true,
        response,
      };
    }
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
