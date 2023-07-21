import { faker } from '@faker-js/faker';
import { ProgramRequiredFileEntity } from '../../../src/parse/entities/program-required-file.entity';
import { FileTypes } from '../../../src/constants';
import { FileIngestionRulesEntity } from '../../../src/parse/entities/file-ingestion-rules.entity';

export class ProgramRequiredFileMock extends ProgramRequiredFileEntity {
  constructor(
    filename: string,
    fileType: FileTypes,
    rule: FileIngestionRulesEntity
  ) {
    super();
    this.id = faker.datatype.uuid();
    this.createdAt = faker.date.past();
    this.fileType = fileType;
    this.filename = filename;
    this.rule = rule;
  }
}
