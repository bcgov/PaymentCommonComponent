import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Repository } from 'typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { MAIL_TEMPLATE_ENUM } from './mail-templates';
import { MailService } from './mail.service';
import { FileTypes } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { FileUploadedEntity } from '../parse/entities/file-uploaded.entity';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(MailService)
    private readonly mailService: MailService,
    @InjectRepository(FileIngestionRulesEntity)
    private ingestionRulesRepo: Repository<FileIngestionRulesEntity>,
    @InjectRepository(ProgramDailyUploadEntity)
    private programDailyRepo: Repository<ProgramDailyUploadEntity>
  ) {}
  /**
   * Gets all existing rules for each program
   * @returns List of Rules
   */
  async getAllRules(): Promise<FileIngestionRulesEntity[]> {
    return await this.ingestionRulesRepo.find({
      relations: {
        requiredFiles: true,
      },
    });
  }

  /**
   * Gets a single rule for a specific program
   * @param program SBC or LABOUR for now
   * @returns A set of rules for a program, or failure
   */
  async getRulesForProgram(program: string): Promise<FileIngestionRulesEntity> {
    return await this.ingestionRulesRepo.findOneOrFail({
      where: {
        program,
      },
    });
  }

  /**
   * Gets the daily status for a specified date for the specified rule
   * @param rule
   * @param date
   * @returns A daily upload entity or nothing
   */
  async getDailyForRule(
    rule: FileIngestionRulesEntity,
    date: Date
  ): Promise<ProgramDailyUploadEntity | null> {
    return await this.programDailyRepo.findOne({
      relations: ['rule', 'files'],
      where: {
        dailyDate: format(date, 'yyyy-MM-dd'),
        rule: {
          id: rule.id,
        },
      },
    });
  }

  /**
   * Creates a new daily entity for the specified rule for a specified date
   * @param rule
   * @param date
   * @returns
   */
  async createNewDaily(
    rule: FileIngestionRulesEntity,
    date: Date
  ): Promise<ProgramDailyUploadEntity> {
    try {
      const newDaily: Partial<ProgramDailyUploadEntity> = {
        dailyDate: format(date, 'yyyy-MM-dd'),
        success: false,
        retries: 0,
        rule,
      };
      const daily = this.programDailyRepo.create(newDaily);
      return await this.programDailyRepo.save(daily);
    } catch (e) {
      throw new Error('Error saving daily upload');
    }
  }
  /**
   * Saves an existing daily with presumably new information
   * @param daily Daily with updated information
   * @returns ProgramDailyUploadEntity
   */
  async saveDaily(
    daily: ProgramDailyUploadEntity
  ): Promise<ProgramDailyUploadEntity> {
    return await this.programDailyRepo.save(daily);
  }
  async dailyUploadAlert(date: Date) {
    const rules = await this.getAllRules();
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await this.getDailyForRule(rule, new Date(date));
      if (!daily) {
        daily = await this.createNewDaily(rule, new Date(date));
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          missingFiles: [],
        });
        continue;
      }
      const successStatus = this.determineDailySuccess(rule, daily.files);
      if (successStatus.success === true) {
        await this.saveDaily({
          ...daily,
          success: true,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          missingFiles: [],
        });
      } else {
        let alerted = false;
        if (daily.retries >= rule.retries) {
          // TODO CCFPCM-441
          alerted = true;
        }
        await this.saveDaily({
          ...daily,
          retries: daily.retries + 1,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: false,
          alerted,
          missingFiles: successStatus.missingFiles,
        });
      }
    }
    return { dailyAlertPrograms, date: date };
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
    missingFiles: { filename: string; fileType: FileTypes }[];
  } {
    const requiredFiles = rule.requiredFiles;
    const missingFiles: { filename: string; fileType: FileTypes }[] = [];
    requiredFiles.forEach((requiredFile) => {
      if (
        !files.some(
          (file) =>
            file.sourceFileType === requiredFile.fileType &&
            file.sourceFileName.includes(requiredFile.filename)
        )
      ) {
        missingFiles.push({
          filename: requiredFile.filename,
          fileType: requiredFile.fileType,
        });
      }
    });
    const success = missingFiles.length === 0;
    return {
      success,
      missingFiles,
    };
  }

  async dailyAlert() {
    const alertsSent = await this.dailyUploadAlert(new Date());

    const programAlerts = alertsSent.dailyAlertPrograms;
    for (const alert of programAlerts) {
      const errors: string[] = [];
      if (!alert.success) {
        const incompleteString = `Daily Upload for ${alert.program} is incomplete.`;
        errors.push(incompleteString);
        alert.missingFiles.forEach((file) => {
          errors.push(
            `Missing a ${file.fileType} file - needs file name "${file.filename}"`
          );
        });
      }

      this.appLogger.log(errors.join(' '));
      if (alert.alerted) {
        const alertDestinations = await this.mailService.getAlertDestinations(
          alert.program,
          alert.missingFiles.map((mf) => mf.filename)
        );
        this.appLogger.log(
          '\n\n=========Alerts Sent for Daily Upload: =========\n'
        );
        this.appLogger.error(
          `Sent an alert to prompt ${alert.program} to complete upload`
        );
        await this.mailService.sendEmailAlertBulk(
          MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
          alertDestinations.map((ad) => ({
            toEmail: ad,
            message: errors.join(' '),
          }))
        );
      }
    }
  }
  catch(err: Error) {
    this.appLogger.error(err);
  }
}
