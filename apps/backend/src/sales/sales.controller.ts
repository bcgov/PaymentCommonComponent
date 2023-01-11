import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  UseInterceptors
} from '@nestjs/common';
import { SalesDTO } from './dto/sales.dto';
import { SalesService } from './sales.service';
import { AppLogger } from '../common/logger.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('sale')
@ApiTags('Sales API')
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Post Sales Event'
  })
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
            { amount: 52.5, currency: 'CAD', exchange_rate: 0.0, method: '01' }
          ],
          misc: {
            employee_id: 'SC61350   '
          },
          distributions: {
            '001': [
              {
                line_number: '00001',
                dist_client_code: '128',
                dist_resp_code: '71607',
                dist_service_line_code: '30660',
                dist_stob_code: '4304',
                dist_project_code: '7100000',
                dist_location_code: '000000',
                dist_future_code: '0000',
                line_dollar_amount: 50.0,
                line_description: 'COMMISSION          ',
                supplier_code: '000000   ',
                revenue_gl_account: '001'
              },
              {
                line_number: '00002',
                dist_client_code: '128',
                dist_resp_code: '71OCG',
                dist_service_line_code: '00000',
                dist_stob_code: '1575',
                dist_project_code: '7100000',
                dist_location_code: '000000',
                dist_future_code: '0000',
                line_dollar_amount: 2.5,
                line_description: 'GST ON COMMISSION   ',
                supplier_code: '000000   ',
                revenue_gl_account: '001'
              }
            ],
            '002': [
              {
                line_number: '00001',
                dist_client_code: '000',
                dist_resp_code: '00000',
                dist_service_line_code: '00000',
                dist_stob_code: '0000',
                dist_project_code: '0000000',
                dist_location_code: '000000',
                dist_future_code: '0000',
                line_dollar_amount: 0.0,
                line_description: '                    ',
                supplier_code: '000000   ',
                revenue_gl_account: '001'
              }
            ]
          },
          source: {
            source_id: 'SBC',
            location_id: '00002',
            revenue_gl_accounts: {
              '001': {
                dist_client_code: '074',
                dist_resp_code: '32G02',
                dist_service_line_code: '58200',
                dist_stob_code: '1461',
                dist_project_code: '3200000',
                dist_location_code: '000000',
                dist_future_code: '0000',
                supplier_code: '000000   '
              }
            }
          }
        }
      ]
    }
  })
  @ApiResponse({
    description: 'Returns the parsed sales reconciliation data',
    schema: {
      example: {
        data: [
          {
            transaction_id: '20221212-00002-1000001',
            transaction_date: '2022-12-12',
            transaction_time: '11.57.00.9',
            location_id: 2,
            payments: [
              {
                method: '01',
                amount: 52.5,
                exchange_rate: 0,
                currency: 'CAD'
              }
            ],
            payment_total: 52.5
          }
        ]
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async saveSalesEvent(@Body() salesEvent: SalesDTO[]) {
    this.appLogger.log(salesEvent);
    try {
      return this.salesService.saveSalesEvent(salesEvent);
    } catch (e) {
      throw new InternalServerErrorException(
        'An unknown error occured while saving a form'
      );
    }
  }
}
