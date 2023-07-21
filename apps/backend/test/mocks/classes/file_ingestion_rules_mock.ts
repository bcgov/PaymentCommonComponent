import { faker } from '@faker-js/faker';
import { FileIngestionRulesEntity } from '../../../src/parse/entities/file-ingestion-rules.entity';
import { ProgramRequiredFileMock } from './required_file_mock';
import { FileTypes } from '../../../src/constants';

export class FileIngestionRulesMock extends FileIngestionRulesEntity {
  constructor(program: string) {
    super();
    this.id = faker.datatype.uuid();
    this.program = program;
    this.retries = faker.datatype.number({ min: 0, max: 3 });
    this.requiredFiles = [];
  }

  public assignRequiredFile(filename: string, fileType: FileTypes) {
    const requiredFile = new ProgramRequiredFileMock(filename, fileType, this);
    this.requiredFiles.push(requiredFile);
  }
}
