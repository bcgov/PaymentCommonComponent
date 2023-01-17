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
          transaction_id: '20230103-00025-1000001',
          transaction_date: '2022-11-30-13.33.31.875973',
          fiscal_close_date: '20230103',
          payment_total: 1000.0,
          misc: {
            employee_id: 'SC61350',
            void_indicator: ' ',
            transaction_reference: ''
          },
          source: {
            source_id: 'SBC',
            location_id: 'SBC_001',
            merchant_ids: []
          },
          payments: [
            {
              amount: 500.0,
              currency: 'CAD',
              exchange_rate: 0.0,
              method: '01' // Which one should we adopt, what is our master ENUM for this going to look like?
            },
            {
              amount: 500.0,
              currency: 'CAD',
              exchange_rate: 0.0,
              method: '11'
            }
          ],
          accounting: {
            items: [
              {
                sequence: '001',
                details: {
                  code: '1234',
                  description: '' // This object should allow user defined additional keys.
                },
                distributions: [
                  {
                    line_number: '00001',
                    line_description: 'A/R HLTH GEN RECOV  ',
                    line_dollar_amount: 1000.01,
                    dist_client_code: '026',
                    dist_resp_code: '66020',
                    dist_service_line_code: '44275',
                    dist_stob_code: '1278',
                    dist_project_code: '6600000',
                    dist_location_code: '000000',
                    dist_future_code: '0000',
                    supplier_code: '000000',
                    EFT: {
                      //
                      vendor: 'xxx'
                    },
                    revenue_gl_account: {
                      dist_client_code: '026',
                      dist_resp_code: '66020',
                      dist_service_line_code: '44275',
                      dist_stob_code: '1474',
                      dist_project_code: '6600000',
                      dist_location_code: '000000',
                      dist_future_code: '0000',
                      supplier_code: '000000   '
                    }
                  },
                  {
                    line_number: '00002',
                    dist_client_code: '026',
                    dist_resp_code: '66020',
                    dist_service_line_code: '44275',
                    dist_stob_code: '1278',
                    dist_project_code: '6600000',
                    dist_location_code: '000000',
                    dist_future_code: '0000',
                    line_dollar_amount: 1000.01,
                    line_description: 'A/R HLTH GEN RECOV  ',
                    supplier_code: '000000',
                    revenue_gl_account: {
                      dist_client_code: '026',
                      dist_resp_code: '66020',
                      dist_service_line_code: '44275',
                      dist_stob_code: '1474',
                      dist_project_code: '6600000',
                      dist_location_code: '000000',
                      dist_future_code: '0000',
                      supplier_code: '000000   '
                    }
                  }
                ]
              },
              {
                sequence: '002',
                details: {
                  code: '1234'
                },
                distributions: [
                  {
                    line_number: '00001',
                    line_description: 'A/R HLTH GEN RECOV  ',
                    line_dollar_amount: 1000.01,
                    dist_client_code: '026',
                    dist_resp_code: '66020',
                    dist_service_line_code: '44275',
                    dist_stob_code: '1278',
                    dist_project_code: '6600000',
                    dist_location_code: '000000',
                    dist_future_code: '0000',
                    supplier_code: '000000',
                    revenue_gl_account: {
                      dist_client_code: '026',
                      dist_resp_code: '66020',
                      dist_service_line_code: '44275',
                      dist_stob_code: '1474',
                      dist_project_code: '6600000',
                      dist_location_code: '000000',
                      dist_future_code: '0000',
                      supplier_code: '000000   '
                    }
                  },
                  {
                    line_number: '00002',
                    dist_client_code: '026',
                    dist_resp_code: '66020',
                    dist_service_line_code: '44275',
                    dist_stob_code: '1278',
                    dist_project_code: '6600000',
                    dist_location_code: '000000',
                    dist_future_code: '0000',
                    line_dollar_amount: 1000.01,
                    line_description: 'A/R HLTH GEN RECOV  ',
                    supplier_code: '000000',
                    revenue_gl_account: {
                      dist_client_code: '026',
                      dist_resp_code: '66020',
                      dist_service_line_code: '44275',
                      dist_stob_code: '1474',
                      dist_project_code: '6600000',
                      dist_location_code: '000000',
                      dist_future_code: '0000',
                      supplier_code: '000000   '
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  })
  @ApiResponse({
    description: 'Returns the parsed sales reconciliation data',
    schema: {
      example: {
        data: []
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async saveSalesEvent(@Body() salesEvent: any[]) {
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
