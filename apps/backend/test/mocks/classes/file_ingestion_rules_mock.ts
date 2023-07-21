import { faker } from '@faker-js/faker';
import { FileIngestionRulesEntity } from '../../../src/parse/entities/file-ingestion-rules.entity';

export class FileIngestionRulesMock extends FileIngestionRulesEntity {
  constructor(
    program: string,
  ) {
    super();
    this.id = faker.datatype.uuid();
    this.program = program;
    this.retries = faker.datatype.number({ min: 0, max: 3 });
  }
}
