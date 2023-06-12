import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { ParseService } from './parse.service';
import { DailyAlertRO } from './ro/daily-alert.ro';
import { FileTypes } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { TransactionEntity } from '../transaction/entities';
import { TransactionService } from '../transaction/transaction.service';

@Controller('parse')
@ApiTags('Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ParseController {
  constructor(
    @Inject(ParseService)
    private readonly parseService: ParseService,
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @Inject(CashDepositService)
    private readonly cashDepositService: CashDepositService,
    @Inject(PosDepositService)
    private readonly posDepositService: PosDepositService,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  @Post('flat-file')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        program: {
          type: 'string',
          enum: ['SBC', 'LABOUR'],
          nullable: false,
        },
        fileType: {
          type: 'string',
          enum: ['TDI17', 'TDI34'],
          nullable: false,
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Body() body: { program: string; fileType: FileTypes },
    @UploadedFile() file: Express.Multer.File
  ) {
    const contents = file.buffer.toString();
    return this.parseService.readAndParseFile({
      type: body.fileType,
      fileName: file.originalname,
      program: body.program,
      fileContents: contents,
    });
  }

  @Post('upload-file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          nullable: false,
        },
        fileType: {
          type: 'string',
          enum: ['TDI17', 'TDI34', 'SBC_SALES'],
          nullable: false,
        },
        program: {
          type: 'string',
          enum: ['SBC', 'LABOUR'],
          nullable: false,
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndParseFile(
    @Body() body: { fileName: string; fileType: FileTypes; program: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    const { fileName, fileType, program } = body;
    this.appLogger.log(`Parsing ${fileName} - ${fileType}`);
    const contents = file.buffer.toString();

    const allFiles = await this.parseService.getAllFiles();
    const allFilenames = new Set(allFiles.map((f) => f.sourceFileName));
    if (allFilenames.has(fileName)) {
      throw new BadRequestException({
        message: 'Invalid filename, this already exists',
      });
    }

    // Throws an error if no rules exist for the specified program
    const rules = await this.parseService.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }

    // Creates a new daily status for the rule, if none exist, so that files can be tracked
    let daily = await this.parseService.getDailyForRule(rules, new Date());
    if (!daily) {
      daily = await this.parseService.createNewDaily(rules, new Date());
    }

    try {
      // FileType is based on the filename (from Parser) or from the endpoint body
      if (fileType === FileTypes.SBC_SALES) {
        this.appLogger.log('Parse and store SBC Sales in DB...', fileName);
        const garmsSales: TransactionEntity[] =
          await this.parseService.parseGarmsFile(contents, fileName); // validating step
        const fileToSave = await this.parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: garmsSales.length,
          dailyUpload: daily,
        });
        this.appLogger.log(`Transaction count: ${garmsSales.length}`);
        await this.transactionService.saveTransactions(
          garmsSales.map((sale) => ({
            ...sale,
            fileUploadedEntity: fileToSave,
          }))
        );
      }

      if (fileType === FileTypes.TDI17) {
        this.appLogger.log('Parse and store TDI17 in DB...', fileName);
        const cashDeposits = await this.parseService.parseTDICashFile(
          fileName,
          program,
          file.buffer
        ); // validating step
        const fileToSave = await this.parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: cashDeposits.length,
          dailyUpload: daily,
        });
        this.appLogger.log(`Cash Deposits count: ${cashDeposits.length}`);
        await this.cashDepositService.saveCashDepositEntities(
          cashDeposits.map((deposit) => ({
            ...deposit,
            fileUploadedEntity: fileToSave,
          }))
        );
      }

      if (fileType === FileTypes.TDI34) {
        this.appLogger.log('Parse and store TDI34 in DB...', fileName);
        const posEntities = await this.parseService.parseTDICardsFile(
          fileName,
          program,
          file.buffer
        );
        const fileToSave = await this.parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: posEntities.length,
          dailyUpload: daily,
        });
        this.appLogger.log(`POS Deposits count: ${posEntities.length}`);
        await this.posDepositService.savePOSDepositEntities(
          posEntities.map((deposit) => ({
            ...deposit,
            fileUploadedEntity: fileToSave,
            timestamp: deposit.timestamp,
          }))
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Error with processing ${fileName}`;
      this.appLogger.log(message);
      throw new BadRequestException({ message });
    }
  }

  /**
   * Commence daily upload for a specific date for each program area we have in the rules
   * Called at the start of a parser lambda run
   */
  @Post('daily-upload')
  async commenceDailyUpload(@Body() body: { date: string }): Promise<void> {
    const rules = await this.parseService.getAllRules();
    for (const rule of rules) {
      const daily = await this.parseService.getDailyForRule(
        rule,
        new Date(body.date)
      );
      if (!daily) {
        await this.parseService.createNewDaily(rule, new Date(body.date));
      }
    }
  }

  /**
   * Makes decisions on whether to send an alert (or error log) for our programs for a date
   * Based on the daily program status, and which files are required by the rules
   * @returns Array of DailyAlertROs to determine which programs are successful and which programs have been alerted
   */
  @Post('daily-upload/alert')
  async dailyUploadAlert(@Body() body: { date: Date }): Promise<DailyAlertRO> {
    const rules = await this.parseService.getAllRules();
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await this.parseService.getDailyForRule(
        rule,
        new Date(body.date)
      );
      if (!daily) {
        daily = await this.parseService.createNewDaily(
          rule,
          new Date(body.date)
        );
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
        });
        continue;
      }
      const success = this.parseService.determineDailySuccess(
        rule,
        daily.files
      );
      if (success === true) {
        await this.parseService.saveDaily({
          ...daily,
          success: true,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
        });
      } else {
        let alerted = false;
        if (daily.retries >= rule.retries) {
          // TODO CCFPCM-441
          alerted = true;
        }
        await this.parseService.saveDaily({
          ...daily,
          retries: daily.retries + 1,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: false,
          alerted,
        });
      }
    }
    return { dailyAlertPrograms, date: body.date };
  }
}
