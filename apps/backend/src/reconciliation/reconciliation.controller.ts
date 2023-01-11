import {
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  Controller,
  ClassSerializerInterceptor,
  Inject,
  Logger,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiResponse,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiTags
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppLogger } from '../common/logger.service';
import { ReconciliationService } from './reconciliation.service';
import { GarmsDTO } from './dto/garms.dto';
import { TransactionEntity } from './entities/transaction.entity';

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

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Post Transaction Data'
  })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      example: [
        {
          sales_transaction_id: '20221212-00002-1000001',
          sales_transaction_date: '2022-12-12-11.57.00.986053',
          fiscal_close_date: '20221212',
          payment_total: 52.5,
          void_indicator: ' ',
          transaction_reference: '',
          payments: [
            {
              amount: 52.5,
              currency: 'CAD',
              exchange_rate: '0.000',
              method: '01'
            }
          ],
          source: { location_id: '00001' }
        }
      ]
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: {
      example: {
        data: [
          {
            transaction_id: '20221212-00002-1000004',
            location_id: 1,
            transaction_date: '2022-12-12',
            transaction_time: '11.57.00.9',
            payment_total: 52.5,
            payments: [
              {
                method: '01',
                amount: 52.5,
                currency: 'CAD',
                exchange_rate: '0.000'
              }
            ]
          }
        ]
      }
    }
  })
  @Post('garms-json')
  async postTransactionData(
    @Body() garmsDTO: GarmsDTO[]
  ): Promise<TransactionEntity[]> {
    return await this.reconService.parseAndReturnGarms(garmsDTO);
  }
}
