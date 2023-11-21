import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { ParseModule } from '../parse/parse.module';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { TransactionModule } from '../transaction/transaction.module';

export const Documentation = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle('PayCoCo API Docs')
    .setVersion(process.env.API_VERSION || '0.0.1')
    .setDescription('Payment Common Component API Documentation')
    .addBasicAuth()
    .build();

  const baseDocument = SwaggerModule.createDocument(app, options, {
    include: [TransactionModule, ParseModule, ReconciliationModule, AppModule],
  });

  SwaggerModule.setup('api', app, baseDocument, {
    swaggerOptions: {
      docExpansion: 'none',
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });
};
