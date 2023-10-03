import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBasicAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ParseService } from './parse.service';
import { FileTypes, Ministries, SUPPORTED_FILE_EXTENSIONS } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionService } from '../transaction/transaction.service';

@Controller('parse')
@ApiBasicAuth()
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
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(ParseController.name);
  }

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
    @Body() body: { program: Ministries; fileType: FileTypes },
    @UploadedFile() file: Express.Multer.File
  ) {
    const fileSplit = file.filename.split('.');
    const fileExtension = fileSplit[fileSplit.length - 1];
    if (
      fileSplit.length < 2 ||
      !SUPPORTED_FILE_EXTENSIONS[body.fileType] ||
      !SUPPORTED_FILE_EXTENSIONS[body.fileType].includes(
        fileExtension.toUpperCase()
      )
    ) {
      throw new BadRequestException(
        `${fileExtension} does not match supported type(s) for the metadata provided for ${
          body.fileType
        } files. The following extensions are accepted: ${SUPPORTED_FILE_EXTENSIONS[
          body.fileType
        ].join(', ')}`
      );
    }
    this.appLogger.log({ ...body, file });
    if (body.fileType === FileTypes.TDI34) {
      return this.parseService.parseTDICardsFile(
        file.filename,
        Ministries.LABOUR,
        Buffer.from(file.buffer)
      );
    } else {
      return this.parseService.parseTDICashFile(
        file.filename,
        Ministries.LABOUR,
        Buffer.from(file.buffer)
      );
    }
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
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    @UploadedFile() _file: Express.Multer.File
  ) {
    const { fileName, fileType, program } = body;

    this.appLogger.log(`Parsing ${fileName} - ${fileType} for ${program}`);

    //TODO call parse service to process file event
    throw new HttpException('Not Implemented', 501);
  }
}
