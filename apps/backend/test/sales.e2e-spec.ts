import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { validationPipeConfig } from '../src/app.config';
import { TrimPipe } from '../src/trim.pipe';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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
    const resp = await request(app.getHttpServer())
      .post('/sale')
      .send({
        id: '264595a1-4775-4bfe-9b3a-358bbbb5c4f7',
        sale_date: '2022-10-25',
        journal_name: 'SM J000001',
        ministry_alpha_identifier: 'SM',
        total_amount: 150.5,
        payment_method: [
          {
            amount: 100,
            method: 'CASH'
          },
          {
            amount: 50.5,
            method: 'POS_CREDIT'
          }
        ],
        distributions: [
          {
            line_number: '000001',
            dist_client_code: '130',
            dist_resp_code: '29KGT',
            dist_service_line_code: '38513',
            dist_stob_code: '4303',
            dist_project_code: '29K0230',
            dist_location_code: '000000',
            dist_future_code: '0000',
            line_amount: 150.5,
            line_code: 'C',
            line_description:
              'GA OFF# 00002 2022-08-05                    *900100002',
            gl_date: '2022-10-12',
            supplier_code: 'xxxxxx'
          },
          {
            line_number: '000002',
            dist_client_code: '074',
            dist_resp_code: '32L14',
            dist_service_line_code: '58200',
            dist_stob_code: '1461',
            dist_project_code: '3200000',
            dist_location_code: '000000',
            dist_future_code: '0000',
            line_amount: 150.5,
            line_code: 'D',
            line_description: 'GA OFF# 00014 2022-08-05',
            gl_date: '2022-10-12',
            supplier_code: 'xxxxxx'
          }
        ]
      })
      .expect({})
      .expect(201);

    return;
  });

  afterAll(async () => {
    await app.close();
  });
});
