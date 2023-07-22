import { faker } from '@faker-js/faker';
import { FileTypes } from '../../../src/constants';
import { FileIngestionRulesEntity } from '../../../src/notification/entities/file-ingestion-rules.entity';
import { ProgramRequiredFileEntity } from '../../../src/notification/entities/program-required-file.entity';


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
