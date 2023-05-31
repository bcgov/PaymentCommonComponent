import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { ParseService } from './parse.service';
import { FileTypes } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { TransactionEntity } from '../transaction/entities';

@Controller('parse')
@ApiTags('Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ParseController {
  constructor(
    @Inject(ParseService)
    private readonly parseService: ParseService,
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
    this.appLogger.log(`PARSE PARSE PARSE ${fileName} - ${fileType}`);
    const contents = file.buffer.toString();
    if (fileType === FileTypes.SBC_SALES) {
      this.appLogger.log('Parse and store SBC Sales in DB...', fileName);
      // Parse and validate rows from Garms
      const garmsSales: TransactionEntity[] =
        await this.parseService.parseGarmsFile(contents, fileName);
      this.appLogger.log(`txn count: ${garmsSales.length}`);
      // await this.transactionService.saveTransactions(garmsSales);
    }

    if (fileType === FileTypes.TDI17) {
      this.appLogger.log('Parse and store TDI17 in DB...', fileName);
      const cashDeposits = await this.parseService.parseTDICashFile(
        fileType,
        fileName,
        program,
        file.buffer
      );
      // save
      // await cashService.saveCashDepositEntities(cashDeposits);
    }

    if (fileType === FileTypes.TDI34) {
      this.appLogger.log('Parse and store TDI34 in DB...', fileName);
      const posEntities = await this.parseService.parseTDICardsFile(
        fileType,
        fileName,
        program,
        file.buffer
      );
      // save
      // await posService.savePOSDepositEntities(posEntities);
    }
  }
  catch(err: any) {
    this.appLogger.error(err);
  }
}
