import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import _ from 'underscore';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramRequiredFileEntity } from './entities/program-required-file.entity';
import { FileTypes, Ministries, S3File } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from '../notification/entities/program-daily-upload.entity';
import { NotificationService } from '../notification/notification.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

@Injectable()
export class UploadService {
  constructor(
    @Inject(S3ManagerService) private readonly s3Manager: S3ManagerService,
    @Inject(AppLogger) private readonly appLogger: AppLogger,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>
  ) {
    this.appLogger.setContext(UploadService.name);
  }
  /**
   * upload a file to S3
   * @param filename The name of the file
   * @param filePath The path to the file
   * @param contentType The content type of the file
   * @param body The file contents
   * @returns The status code of the upload
   */
  public async saveS3(
    filename: string,
    filePath: string,
    contentType: string,
    body: Buffer
  ): Promise<unknown> {
    this.appLogger.log('Saving to S3 Bucket');

    try {
      const res = await this.s3Manager.upload({
        Key: `${filePath}/${filename}`,
        Bucket: `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
        Body: body,
        ContentType: contentType,
      });
      return { status: res.$metadata.httpStatusCode };
    } catch (error) {
      this.appLogger.error(error);
      throw new HttpException('Error uploading file to S3', 500);
    }
  }
  /**
   * Compares the file list to be parsed with what is already in DB and removes the duplicates
   * @param fileList List of files to be parsed
   * @returns filtered list of file to be parsed
   */
  async filterDuplicateFileList(fileList: string[]): Promise<string[]> {
    // get the list of already uploaded files
    const allFiles = await this.getAllFiles();

    this.appLogger.log(
      `Found ${allFiles.length} files already uploaded to the  database...`
    );
    // create list of file names
    const allUploadedFiles: string[] = allFiles.map((f) => f.sourceFileName);

    // include only files that are not already in the database
    const parseList = _.difference(fileList, allUploadedFiles);

    return parseList
      .filter((filename) => !filename?.includes('LABOUR2'))
      .filter((itm) => !itm.includes('archive'));
  }
  /**
  
   * Validate the program area and file type for each file in the list
   * return an S3File object, which includes the file contents and metadata
   * @param fileList a string array of file names
   * @param programRules a list of file ingestion rules
   * @returns FileWithMetadata[]
   */
  async getFileObjectAndMetadata(
    file: string,
    requiredFiles: ProgramRequiredFileEntity[],
    programRules: FileIngestionRulesEntity[]
  ): Promise<S3File> {
    // program rules and file types with the file to be parsed
    // validate the program and file type
    const programRule = programRules.find((p) => file.includes(p.program));
    const requiredFile = requiredFiles.find((rf) => file.includes(rf.fileType));

    if (!programRule) {
      throw new BadRequestException(
        `File does not reference to any programs: ${file}`
      );
    }
    if (!requiredFile?.fileType) {
      throw new BadRequestException(
        `File does not reference to any valid file types: ${file}`
      );
    }
    const bucket: string = `pcc-integration-data-files-${process.env.RUNTIME_ENV}`;
    return {
      programRule: programRule,
      fileType: FileTypes[requiredFile.fileType as keyof typeof FileTypes],
      filename: file,
      contents: Buffer.from(
        await this.s3Manager.getObjectString({
          Bucket: bucket,
          Key: file,
        })
      ),
    };
  }

  /**
   * If no records have been passed in from the event, we will check the S3 bucket for any unparsed files
   * This is only for local development and will not be called in any deployed environments
   * @returns
   */
  async checkS3ForFiles(): Promise<string[]> {
    try {
      return (
        (await this.s3Manager.listBucketContents(
          `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
        )) ?? []
      );
    } catch (err) {
      this.appLogger.error(err);
      throw new Error('Error checking S3 for files');
    }
  }

  /**
   * Saves an entity into the Files Uploaded table.
   * Called whenever a file is uploaded by API or parser lambda
   * @param fileUploaded All the necessary information - sourceFileType, name, length, which daily upload to link to
   * @returns Saved FileUploadedEntity
   */
  async saveFileUploaded(
    file: Partial<FileUploadedEntity>
  ): Promise<FileUploadedEntity> {
    return this.uploadedRepo.save(file);
  }

  /**
   * Gets all files
   * @returns List of uploaded files
   */
  async getAllFiles(): Promise<FileUploadedEntity[]> {
    return this.uploadedRepo.find();
  }
  /**
   * The below three functions are lifted straight from the parse controller
   * This is to ensure its working within our lambda flows as the API Gateway
   * is currently unable to take requests from the parsing lambda
   */
  async commenceDailyUpload(date: string): Promise<ProgramDailyUploadEntity[]> {
    const rules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();
    const dailies: ProgramDailyUploadEntity[] = [];
    for (const rule of rules) {
      let daily: ProgramDailyUploadEntity | null =
        await this.notificationService.getProgramDailyUploadRecord(rule, date);
      if (!daily) {
        daily = await this.notificationService.createNewDailyUploadRecord(
          rule,
          date
        );
        daily.rule = rule;
      }
      dailies.push(daily);
    }
    return dailies;
  }
  /**
   * Creates a new daily status for the rule, if none exist, so that files can be tracked after parse, before DB insert
   * @param rules
   * @param date
   * @returns
   */
  async getOrCreateDailyUploadRecord(
    rules: FileIngestionRulesEntity,
    date: string
  ) {
    const dailies = await this.commenceDailyUpload(date);
    return dailies.find((d) => d.rule.id === rules.id);
  }

  /**
   * Checks if the daily is successful by identifying if files are missing
   * @param rules
   * @param date
   */
  async updateDailyRecordSuccess(
    rules: FileIngestionRulesEntity,
    date: string
  ) {
    const daily = await this.notificationService.getProgramDailyUploadRecord(
      rules,
      date
    );
    if (!daily) {
      throw new Error('Error');
    }
    const missingFiles = this.notificationService.findMissingDailyFiles(
      rules,
      daily.files
    );
    if (missingFiles.length === 0) {
      daily.success = true;
      await this.notificationService.saveProgramDailyUpload(daily);
    }
  }

  /**
   *
   * @param file file + metadata
   * @param fileDate metatdata date of the file
   * @param entities the parsed entities
   * @returns
   */
  async saveFile(file: S3File, fileDate: string, length: number) {
    try {
      const fileToSave = await this.saveFileUploaded({
        sourceFileType: file.fileType,
        sourceFileName: file.filename,
        sourceFileLength: length,
        dailyUpload: await this.getOrCreateDailyUploadRecord(
          file.programRule,
          fileDate
        ),
      });

      await this.updateDailyRecordSuccess(file.programRule, fileDate);

      return fileToSave;
    } catch (err) {
      this.appLogger.log('\n\n=========Errors with File Upload: =========\n');
      // only show the custom message if it is a BadRequestException
      // otherwise we will just show the generic message to the user
      const errorMessage =
        err instanceof BadRequestException
          ? `${err.message}`
          : `Error parsing ${file.filename}. Please ensure all rows are valid.`;
      this.appLogger.error(errorMessage);

      await this.notificationService.validationAlert(
        Ministries[file.programRule.program as keyof typeof Ministries],
        file.filename,
        file.fileType,
        errorMessage
      );
    }
  }
}
