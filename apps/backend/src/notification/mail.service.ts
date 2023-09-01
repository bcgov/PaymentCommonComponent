import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { AlertDestinationEntity } from './entities/alert-destination.entity';
import { MAIL_TEMPLATE_ENUM, MailTemplate } from './mail-templates';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class MailService {
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(AlertDestinationEntity)
    private destinationRepo: Repository<AlertDestinationEntity>,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(MailService.name);
    this.axiosInstance = axios.create({
      baseURL: `${process.env.MAIL_SERVICE_BASE_URL}/v2/notifications/`,
      headers: {
        authorization: `ApiKey-v1 ${process.env.MAIL_SERVICE_KEY}`,
        'content-type': 'application/json',
      },
    });
  }

  /**
   * getAlertDestinations - Gets list of destinations / emails to send alerts to
   * @param program Program name
   * @param filenames All the filenames that have issues
   * @returns <string[]> list of destinatinos
   */
  public async getAlertDestinations(
    program: string,
    filenames?: string[]
  ): Promise<AlertDestinationEntity[]> {
    const allDestinations = await this.destinationRepo.find({
      relations: {
        rule: true,
        requiredFile: true,
      },
    });
    return allDestinations
      .filter(
        (destination) =>
          destination.allAlerts === true ||
          destination.rule?.program === program ||
          (destination.requiredFile &&
            filenames &&
            filenames.includes(destination.requiredFile.filename))
      )
      .filter((destination) => destination)
      .map((destination) => destination);
  }

  /**
   * sendEmailAlertSingle - Sends a single email to a single destination
   * @param template From list of template enums
   * @param toEmail Destination email
   * @param message Customization message
   */
  public async sendEmailAlertSingle(
    template: MAIL_TEMPLATE_ENUM,
    toEmail: string,
    message: string
  ) {
    try {
      const emailResponse = await this.axiosInstance.post('email', {
        email_address: toEmail,
        template_id: MailTemplate[template].id,
        personalisation: {
          message,
        },
      });
      this.appLogger.log(
        `${MailTemplate[template].name} email sent to ${toEmail} - id ${emailResponse.data['data']['id']}`
      );
    } catch (error) {
      this.appLogger.error(
        `Error sending ${MailTemplate[template].name} email to ${toEmail}`
      );
    }
  }

  // TODO CCFPCM-598 Make this more generalized for email templates
  /**
   * sendEmailAlertBulk - Sends a template to multiple emails
   * @param template From list of template enums
   * @param emailMessages List of toEmails and messages
   */
  public async sendEmailAlertBulk(
    template: MAIL_TEMPLATE_ENUM,
    toEmails: string[],
    fieldEntries: {
      fieldName: string;
      content: string;
    }[] // Entries are the same for all emails sent here
  ) {
    if (
      !fieldEntries
        .map((fe) => fe.fieldName)
        .every((fn) => MailTemplate[template].fields.includes(fn))
    ) {
      throw new InternalServerErrorException({
        message: `Error sending template ${MailTemplate[template].name}, backend fields do not match what the template expects`,
      });
    }
    try {
      const emailResponse = await this.axiosInstance.post('bulk', {
        name: MailTemplate[template].name,
        template_id: MailTemplate[template].id,
        rows: [
          ['email_address', ...MailTemplate[template].fields],
          ...toEmails.map((toEmail) => [
            toEmail,
            ...fieldEntries.map((fe) => fe.content),
          ]),
        ],
      });
      this.appLogger.log(
        `${MailTemplate[template].name} email sent to ${toEmails
          .map((toEmail) => toEmail)
          .join(', ')} - id ${emailResponse.data['data']['id']}`
      );
    } catch (error) {
      this.appLogger.error(
        `Error sending ${MailTemplate[template].name} email to ${toEmails
          .map((toEmail) => toEmail)
          .join(', ')}`
      );
    }
  }
}
