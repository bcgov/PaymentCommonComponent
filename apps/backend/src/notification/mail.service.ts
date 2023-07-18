import axios, { AxiosInstance } from 'axios';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MAIL_TEMPLATE_ENUM, MailTemplate } from './mail-templates';
import { AppLogger } from '../logger/logger.service';
import { AlertDestinationEntity } from './entities/alert-destination.entity';

@Injectable()
export class MailService {
  private axiosInstance: AxiosInstance;

  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(AlertDestinationEntity)
    private destinationRepo: Repository<AlertDestinationEntity>
  ) {
    this.axiosInstance = axios.create({
      baseURL: `${process.env.MAIL_SERVICE_BASE_URL}/v2/notifications/email`,
      headers: {
        authorization: `ApiKey-v1 ${process.env.MAIL_SERVICE_KEY}`,
        'content-type': 'application/json',
      },
    });
  }

  public async getAlertDestinations(
    program: string,
    missingFilenames: string[]
  ): Promise<string[]> {
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
          missingFilenames.includes(destination.requiredFile.filename)
      )
      .map((destination) => destination.destination);
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
