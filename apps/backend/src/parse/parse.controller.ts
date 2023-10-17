import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBasicAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import {
  DataSource,
  FileTypes,
  Ministries,
  SUPPORTED_FILE_EXTENSIONS,
} from '../constants';
import { AppLogger } from '../logger/logger.service';

@Controller('parse')
@ApiBasicAuth()
@ApiTags('Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ParseController {
  constructor(
    @Inject(UploadService)
    private uploadService: UploadService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(ParseController.name);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
        source: {
          type: 'string',
          enum: ['bcm', 'sbc'],
          nullable: false,
        },
        fileType: {
          type: 'string',
          enum: ['TDI17', 'TDI34', 'SBC_SALES'],
          nullable: false,
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      program: Ministries;
      source: DataSource;
      fileType: FileTypes;
    }
  ) {
    const fileSplit = file.originalname.split('.');

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

    return await this.uploadService.saveS3(
      file.originalname,
      body.source,
      file.mimetype,
      file.buffer
    );
  }
}
