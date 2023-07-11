import { faker } from '@faker-js/faker';
import { FileIngestionRulesEntity } from '../../../src/uploads/entities/file-ingestion-rules.entity';

export class FileIngestionRulesMock extends FileIngestionRulesEntity {
  constructor(
    program: string,
    cashChequesFilename?: string | undefined,
    posFilename?: string | undefined,
    transactionsFilename?: string | undefined
  ) {
    super();
    this.id = faker.datatype.uuid();
    this.program = program;
    this.retries = faker.datatype.number({ min: 0, max: 3 });
    this.cashChequesFilename = cashChequesFilename;
    this.posFilename = posFilename;
    this.transactionsFilename = transactionsFilename;
  }
}
