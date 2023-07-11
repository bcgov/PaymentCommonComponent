import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { Repository } from 'typeorm';
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>,
    @InjectRepository(FileIngestionRulesEntity)
    private ingestionRulesRepo: Repository<FileIngestionRulesEntity>,
    @InjectRepository(ProgramDailyUploadEntity)
    private programDailyRepo: Repository<ProgramDailyUploadEntity>
  ) {}
  /**
   * Gets all files
   * @returns List of uploaded files
   */
  async getAllFiles(): Promise<FileUploadedEntity[]> {
    return this.uploadedRepo.find();
  }

  /**
   * Saves an entity into the Files Uploaded table.
   * Called whenever a file is uploaded by API or parser lambda
   * @param fileUploaded All the necessary information - sourceFileType, name, length, which daily upload to link to
   * @returns Saved FileUploadedEntity
   */
  async saveFileUploaded(
    fileUploaded: Partial<FileUploadedEntity>
  ): Promise<FileUploadedEntity> {
    return this.uploadedRepo.save(fileUploaded);
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

  createDailyProgramUpload(
    daily: Partial<ProgramDailyUploadEntity>
  ): ProgramDailyUploadEntity {
    return this.programDailyRepo.create(daily);
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
      const daily = this.createDailyProgramUpload(newDaily);
      return await this.saveDaily(daily);
    } catch (e) {
      throw new Error('Error saving daily upload');
    }
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
   * Gets a single rule for a specific program
   * @param program SBC or LABOUR for now
   * @returns A set of rules for a program, or failure
   */
  async getUploadRulesForProgram(
    program: string
  ): Promise<FileIngestionRulesEntity> {
    return await this.ingestionRulesRepo.findOneOrFail({
      where: {
        program,
      },
    });
  }
  /**
   * Gets all existing rules for each program
   * @returns List of Rules
   */
  async getAllUploadRules(): Promise<FileIngestionRulesEntity[]> {
    return await this.ingestionRulesRepo.find();
  }
  /**
   * The below three functions are lifted straight from the parse controller
   * This is to ensure its working within our lambda flows as the API Gateway
   * is currently unable to take requests from the parsing lambda
   */
  async commenceDailyUpload(date: Date) {
    const rules = await this.getAllUploadRules();
    for (const rule of rules) {
      const daily = await this.getDailyForRule(rule, new Date(date));
      if (!daily) {
        return await this.createNewDaily(rule, new Date(date));
      }
    }
  }
}
