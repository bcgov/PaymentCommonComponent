import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  Logger
} from '@nestjs/common';
import { ApiOperation, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppLogger } from '../common/logger.service';
import { ReconciliationService } from './reconciliation.service';

@Controller('parse')
@ApiTags('Flat File and Garms Json Test Parser API')
@UseInterceptors(ClassSerializerInterceptor)
export class ReconciliationController {
  constructor(
    @Inject(ReconciliationService)
    private readonly reconService: ReconciliationService,
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
          nullable: false
        },
        fileType: {
          type: 'string',
          enum: ['TDI17', 'TDI34', 'DDF'],
          nullable: false
        },
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Body() body: { program: string; fileType: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.reconService.readAndParseFile(
      body.fileType,
      body.program,
      file.originalname,
      file.buffer
    );
  }

  @ApiOperation({
    summary: 'Post Transaction Data'
  })
  @Post('garms-json')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadGarmsJsonFile(@UploadedFile() file: Express.Multer.File) {
    return this.reconService.readAndParseGarms(file.originalname, file.buffer);
  }
}
