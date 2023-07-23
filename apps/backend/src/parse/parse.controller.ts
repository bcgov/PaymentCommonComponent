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
import { NotificationService } from '../notification/notification.service';

@Controller('parse')
@ApiTags('Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ParseController {
  constructor(
    @Inject(ParseService)
    private readonly parseService: ParseService,
    @Inject(NotificationService)
    private readonly alertService: NotificationService,
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
    //TODO call parse service to process file event    
    return {
      fileName,
      fileType,
      program,
      contents,
    }
    }
  /**
   * Makes decisions on whether to send an alert (or error log) for our programs for a date
   * Based on the daily program status, and which files are required by the rules
   * @returns Array of DailyAlertROs to determine which programs are successful and which programs have been alerted
   */
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          nullable: false,
          example: '2023-01-01',
        },
      },
    },
  })

  @Post('daily-upload/alert')
  async dailyUploadAlert(@Body() body: { date: Date }): Promise<DailyAlertRO> {
    return await this.alertService.dailyUploadAlert(body.date);
  }
}
