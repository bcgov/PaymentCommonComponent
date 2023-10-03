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
import { S3ManagerService } from 'src/s3-manager/s3-manager.service';
import { FileTypes, Ministries, SUPPORTED_FILE_EXTENSIONS } from '../constants';
import { AppLogger } from '../logger/logger.service';

@Controller('parse')
@ApiBasicAuth()
@ApiTags('Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ParseController {
  constructor(
    @Inject(S3ManagerService)
    private readonly s3: S3ManagerService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(ParseController.name);
  }

  @Post('upload')
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() body: { program: Ministries; fileType: FileTypes },
    @UploadedFile() file: Express.Multer.File
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
    // TO DO - restructure s3and use enum for the proper keys
    const key = FileTypes.SBC_SALES === body.fileType ? 'sbc' : 'bcm';
    try {
      const res = await this.s3.upload({
        Bucket: `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
        Key: key,
        Body: file.buffer,
        ContentType: fileExtension,
      });
      console.log(res);
      return {
        status: res?.$metadata.httpStatusCode,
      };
    } catch (err) {
      this.appLogger.error(err);
      throw new HttpException('Error uploading file to S3', 500);
    }
  }
}
