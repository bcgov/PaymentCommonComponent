import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SalesModule } from '../sales/sales.module';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { AppModule } from '../app.module';

export const Documentation = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle('PayCoCo API Docs')
    .setDescription('Payment Common Component API Documentation')
    .setVersion(`1.0.0`)
    // .addBearerAuth()
    .build();

  const baseDocument = SwaggerModule.createDocument(app, options, {
    include: [SalesModule, ReconciliationModule, AppModule]
  });

  SwaggerModule.setup('api', app, baseDocument, {
    swaggerOptions: {
      docExpansion: 'none',
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2
    }
  });
};
