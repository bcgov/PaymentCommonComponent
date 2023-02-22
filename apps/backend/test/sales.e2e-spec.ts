import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { validationPipeConfig } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { TrimPipe } from '../src/trim.pipe';

describe('Sales Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new TrimPipe(),
      new ValidationPipe(validationPipeConfig)
    );
    await app.init();
  });

  it('/sale (POST)', async () => {
    return await request(app.getHttpServer())
      .post('/sale')
      .send([
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
              exchange_rate: 0,
              method: '01'
            }
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
                line_dollar_amount: 50,
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
                line_dollar_amount: 0,
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
      ])
      .expect([])
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
