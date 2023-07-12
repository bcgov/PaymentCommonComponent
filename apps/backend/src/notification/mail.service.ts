import axios, { AxiosInstance } from 'axios';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { MAIL_TEMPLATE_ENUM, MailTemplate } from './mail-templates';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  private axiosInstance: AxiosInstance;

  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {
    this.axiosInstance = axios.create({
      baseURL: `${process.env.MAIL_SERVICE_BASE_URL}/v2/notifications/email`,
      headers: {
        authorization: `ApiKey-v1 ${process.env.MAIL_SERVICE_KEY}`,
        'content-type': 'application/json',
      },
    });
  }

  public async sendEmailAlert(
    template: MAIL_TEMPLATE_ENUM,
    toEmail: string,
    message: string
  ) {
    try {
      const emailResponse = await this.axiosInstance.post('', {
        email_address: toEmail,
        template_id: MailTemplate[template].id,
        personalisation: {
          message,
        },
      });
      this.appLogger.log(
        `${MailTemplate[template].name} email sent to ${toEmail} - id ${emailResponse.data['id']}`
      );
    } catch (error) {
      this.appLogger.error(
        `Error sending ${MailTemplate[template].name} email to ${toEmail}`
      );
    }
  }
}
