import { Inject, Injectable, Logger } from '@nestjs/common';
import { FileTypes } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { FileIngestionRulesEntity } from '../uploads/entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from '../uploads/entities/file-uploaded.entity';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(UploadsService)
    private uploadsService: UploadsService,
    @Inject(S3ManagerService)
    private s3: S3ManagerService
  ) {}

  /**
   * Gets the daily upload for today, or creates one if it doesn't exist
   * @param rules
   *
   */
  async checkDailyFiles(rules: FileIngestionRulesEntity[]) {
    this.appLogger.log('Processing all files...');
    try {
      // const fileList =
      //   (await this.s3.listBucketContents(
      //     `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
      //   )) || [];

      // const allFiles = await this.uploadsService.getAllFiles();
      // const allUploadedFiles: string[] = allFiles.map((f) => f.sourceFileName);

      // const parseList = _.difference(fileList, allUploadedFiles);

      // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
      // const finalParseList = parseList.filter(
      //   (filename) => !filename?.includes('LABOUR2')
      // );
      this.appLogger.log('Creating daily upload for today if needed');

      await this.uploadsService.commenceDailyUpload(new Date());
      // await axios.post(
      //   `${API_URL}/v1/parse/daily-upload`,
      //   {
      //     date: new Date(),
      //   },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      // Parse & Save only files that have not been parsed before
      // for (const filename of finalParseList) {
      //   this.appLogger.log(`Parsing ${filename}..`);
      //   const event = { eventType: 'all', filename: filename };

      //   await this.processEvent(
      //     event.filename ?? '',
      //     `pcc-recon-reports-${process.env.RUNTIME_ENV}`,
      //     event.eventType
      //   );
      // }
      //   const instance = ()=> {
      //   if (!API_URL) {
      //     appLogger.error(
      //       'No API URL present, please check the environment variables'
      //     );
      //     return;
      //   } else {
      //     return axios.create({ baseURL: API_URL });
      //   }
      // }
      // const alertsSentResponse = await axiosInstance.post(
      //   '/v1/parse/daily-upload/alert',
      //   {
      //     date: new Date(),
      //   },
      //   {
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      // appLogger.log(alertsSentResponse.data.data);
      // const alertsSent: DailyAlertRO = alertsSentResponse.data.data;
      this.appLogger.log('Creating daily upload for today if needed');

      await this.uploadsService.commenceDailyUpload(new Date());
      const alertsSent = await this.dailyUploadAlert(new Date(), rules);

      const programAlerts = alertsSent.dailyAlertPrograms;
      for (const alert of programAlerts) {
        if (!alert.success) {
          this.appLogger.log(`Daily Upload for ${alert.program} is incomplete`);
          !alert.files.hasTdi17 &&
            this.appLogger.log(`${alert.program} is missing a TDI17 file`);
          !alert.files.hasTdi34 &&
            this.appLogger.log(`${alert.program} is missing a TDI34 file`);
          !alert.files.hasTransactionFile &&
            this.appLogger.log(
              `${alert.program} is missing a Transactions file`
            );
        }
        if (alert.alerted) {
          this.appLogger.log(
            '\n\n=========Alerts Sent for Daily Upload: =========\n'
          );
          this.appLogger.error(
            `Sent an alert to prompt ${alert.program} to complete upload`
          );
        }
      }
    } catch (err) {
      this.appLogger.error(err);
    }
  }
  /**
   * Determines if a daily status is successful or not based on the incoming rules
   * @param rule
   * @param files Files uploaded on the day
   * @returns Success or no
   */
  determineDailySuccess(
    rule: FileIngestionRulesEntity,
    files: FileUploadedEntity[]
  ): {
    success: boolean;
    hasTdi17: boolean;
    hasTdi34: boolean;
    hasTransactionFile: boolean;
  } {
    const { cashChequesFilename, posFilename, transactionsFilename } = rule;
    const hasTdi17 = !!cashChequesFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.TDI17)
      : true;
    const hasTdi34 = !!posFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.TDI34)
      : true;
    const hasTransactionFile = !!transactionsFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.SBC_SALES)
      : true;
    const success = hasTdi17 && hasTdi34 && hasTransactionFile;
    return {
      success,
      hasTdi17,
      hasTdi34,
      hasTransactionFile,
    };
  }
  /**
   * Checks All Files for a given day and sends alerts if needed
   * @param date
   * @param rules
   * @returns
   */

  async dailyUploadAlert(date: Date, rules: FileIngestionRulesEntity[]) {
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await this.uploadsService.getDailyForRule(
        rule,
        new Date(date)
      );
      if (!daily) {
        daily = await this.uploadsService.createNewDaily(rule, new Date(date));
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          files: { hasTdi17: true, hasTdi34: true, hasTransactionFile: true },
        });
        continue;
      }
      const successStatus = this.determineDailySuccess(rule, daily.files);
      if (successStatus.success === true) {
        await this.uploadsService.saveDaily({
          ...daily,
          success: true,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          files: { hasTdi17: true, hasTdi34: true, hasTransactionFile: true },
        });
      } else {
        let alerted = false;
        if (daily.retries >= rule.retries) {
          // TODO CCFPCM-441
          alerted = true;
        }
        await this.uploadsService.saveDaily({
          ...daily,
          retries: daily.retries + 1,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: false,
          alerted,
          files: {
            hasTdi17: successStatus.hasTdi17,
            hasTdi34: successStatus.hasTdi34,
            hasTransactionFile: successStatus.hasTransactionFile,
          },
        });
      }
    }
    return { dailyAlertPrograms, date: date };
  }
}
