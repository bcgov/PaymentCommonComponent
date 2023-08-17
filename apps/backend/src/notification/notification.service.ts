import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Between, Repository } from 'typeorm';
import { AlertDestinationEntity } from './entities/alert-destination.entity';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { MAIL_TEMPLATE_ENUM } from './mail-templates';
import { MailService } from './mail.service';
import { Ministries } from '../constants';
import { ProgramTemplateName } from '../lambdas/const';
import { AppLogger } from '../logger/logger.service';
import { FileUploadedEntity } from '../parse/entities/file-uploaded.entity';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(MailService)
    private readonly mailService: MailService,
    @InjectRepository(FileIngestionRulesEntity)
    private ingestionRulesRepo: Repository<FileIngestionRulesEntity>,
    @InjectRepository(ProgramDailyUploadEntity)
    private programDailyRepo: Repository<ProgramDailyUploadEntity>,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(NotificationService.name);
  }
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
      relations: ['requiredFiles'],
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
  async getProgramDailyUploadRecord(
    rule: FileIngestionRulesEntity,
    date: string
  ): Promise<ProgramDailyUploadEntity | null> {
    return await this.programDailyRepo.findOne({
      relations: ['rule', 'files'],
      where: {
        dailyDate: date,
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
  async createNewDailyUploadRecord(
    rule: FileIngestionRulesEntity,
    date: string
  ): Promise<ProgramDailyUploadEntity> {
    try {
      const newDaily: Partial<ProgramDailyUploadEntity> = {
        dailyDate: date,
        success: false,
        rule,
      };
      const daily = this.programDailyRepo.create(newDaily);
      const dailySaved = await this.programDailyRepo.save(daily);
      dailySaved.files = [];
      return dailySaved;
    } catch (e) {
      throw new Error('Error saving daily upload');
    }
  }
  /**
   * Saves an existing daily with presumably new information
   * @param daily Daily with updated information
   * @returns ProgramDailyUploadEntity
   */
  async saveProgramDailyUpload(
    daily: ProgramDailyUploadEntity
  ): Promise<ProgramDailyUploadEntity> {
    return await this.programDailyRepo.save(daily);
  }

  /**
   * Gets all daily upload statuses with all relations
   * @param fromDate First date to check
   * @param toDate Last date to check
   * @returns ProgramDailyUploadEntity[]
   */
  async retrieveRecentDailyStatuses(
    fromDate: Date,
    toDate: Date
  ): Promise<ProgramDailyUploadEntity[]> {
    return this.programDailyRepo.find({
      where: {
        dailyDate: Between(
          format(fromDate, 'yyyy-MM-dd'),
          format(toDate, 'yyyy-MM-dd')
        ),
      },
      relations: {
        rule: true,
        files: true,
      },
      order: {
        dailyDate: 'ASC',
      },
    });
  }

  /**
   * Determines if a daily status is successful or not based on the incoming rules
   * @param rule
   * @param files Files uploaded on the day
   * @returns Success or no
   */
  findMissingDailyFiles(
    rule: FileIngestionRulesEntity,
    files: FileUploadedEntity[]
  ): ProgramRequiredFileEntity[] {
    return rule.requiredFiles.filter((requiredFile) => {
      if (
        !files.some(
          (file) =>
            file.sourceFileType === requiredFile.fileType &&
            file.sourceFileName.includes(requiredFile.filename)
        )
      ) {
        return requiredFile;
      }
    });
  }

  async validationAlert(
    ministry: Ministries,
    filename: string,
    fileType: string,
    errorMessage: string
  ) {
    const alertDestinationEntities: AlertDestinationEntity[] =
      await this.mailService.getAlertDestinations(ministry, [filename]);
    const alertDestinations = alertDestinationEntities.map(
      (itm) => itm.destination
    );

    if (!alertDestinations.length) {
      return;
    }
    const program =
      ProgramTemplateName[ministry as keyof typeof ProgramTemplateName];
    await this.mailService.sendEmailAlertBulk(
      MAIL_TEMPLATE_ENUM.FILE_VALIDATION_ALERT,
      alertDestinations.map((ad) => ad),
      [
        {
          fieldName: 'date',
          content: format(new Date(), 'MMM do, yyyy'),
        },
        {
          fieldName: 'ministryDivision',
          content: program,
        },
        {
          fieldName: 'error',
          content: `Validation error found in ${ministry} file: ${filename}.\n${errorMessage}`,
        },
      ]
    );
  }
}
