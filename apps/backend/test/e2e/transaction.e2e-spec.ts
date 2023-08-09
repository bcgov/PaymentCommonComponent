import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import * as transactionJson from '../../sample-files/transaction.json';
import { validationPipeConfig } from '../../src/app.config';
import { AppModule } from '../../src/app.module';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { TrimPipe } from '../../src/trim.pipe';

describe('Transaction Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new TrimPipe(),
      new ValidationPipe(validationPipeConfig)
    );
    await app.init();
  });

  it('/transaction (POST)', async () => {
    return await request(app.getHttpServer())
      .post('/transaction')
      .send(transactionJson)
      .expect({})
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
