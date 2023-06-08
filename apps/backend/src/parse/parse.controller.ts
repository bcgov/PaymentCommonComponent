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

    const rules = await this.parseService.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }
    let daily = await this.parseService.getDailyForRule(rules, new Date());
    if (!daily) {
      daily = await this.parseService.createNewDaily(rules, new Date());
    }

    try {
      if (fileType === FileTypes.SBC_SALES) {
        this.appLogger.log('Parse and store SBC Sales in DB...', fileName);
        const garmsSales: TransactionEntity[] =
          await this.parseService.parseGarmsFile(contents, fileName);
        const fileToSave = await this.parseService.saveFileUploaded({
          source_file_type: fileType,
          source_file_name: fileName,
          source_file_length: garmsSales.length,
          programFiles: daily,
        });
        this.appLogger.log(`txn count: ${garmsSales.length}`);
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
          fileType,
          fileName,
          program,
          file.buffer
        );
        const fileToSave = await this.parseService.saveFileUploaded({
          source_file_type: fileType,
          source_file_name: fileName,
          source_file_length: cashDeposits.length,
          programFiles: daily,
        });
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
          fileType,
          fileName,
          program,
          file.buffer
        );
        const fileToSave = await this.parseService.saveFileUploaded({
          source_file_type: fileType,
          source_file_name: fileName,
          source_file_length: posEntities.length,
          programFiles: daily,
        });
        await this.posDepositService.savePOSDepositEntities(
          posEntities.map((deposit) => ({
            ...deposit,
            fileUploadedEntity: fileToSave,
            timestamp: deposit.timestamp,
          }))
        );
      }
    } catch (err: unknown) {
      throw new BadRequestException({
        message:
          err instanceof Error
            ? err.message
            : `Error with processing ${fileName}`,
      });
    }
  }

  // Commence daily upload for each program area we have
  @Post('daily-upload')
  async commenceDailyUpload(@Body() body: { date: Date }): Promise<void> {
    const rules = await this.parseService.getAllRules();
    for (const rule of rules) {
      const daily = await this.parseService.getDailyForRule(rule, body.date);
      if (!daily) {
        await this.parseService.createNewDaily(rule, body.date);
      }
    }
    return;
  }

  @Post('daily-upload/alert')
  async dailyUploadAlert(@Body() body: { date: Date }): Promise<DailyAlertRO> {
    const rules = await this.parseService.getAllRules();
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await this.parseService.getDailyForRule(rule, body.date);
      if (!daily) {
        daily = await this.parseService.createNewDaily(rule, body.date);
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
        });
        continue;
      }
      const { cashChequesFilename, cardsFilename, transactionsFilename } = rule;
      const files = daily.files;
      // For each required file type, check if the file exists
      let hasTdi17 = false,
        hasTdi34 = false,
        hasTransactionFile = false;
      let success = true;
      if (cashChequesFilename) {
        hasTdi17 =
          files?.some((file) => file.source_file_type === FileTypes.TDI17) ||
          false;
      }
      if (cardsFilename) {
        hasTdi34 =
          files?.some((file) => file.source_file_type === FileTypes.TDI34) ||
          false;
      }
      if (transactionsFilename) {
        hasTransactionFile =
          files?.some(
            (file) => file.source_file_type === FileTypes.SBC_SALES
          ) || false;
      }
      if (!hasTdi17 || !hasTdi34 || !hasTransactionFile) {
        success = false;
      }
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
          success: true,
          alerted,
        });
      }
    }
    return { dailyAlertPrograms, date: body.date };
  }
}
