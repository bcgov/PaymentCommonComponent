import { faker } from '@faker-js/faker';
import { ProgramRequiredFileMock } from './required_file_mock';
import { FileTypes } from '../../../src/constants';
import { FileIngestionRulesEntity } from '../../../src/notification/entities/file-ingestion-rules.entity';
import { ProgramRequiredFileEntity } from '../../../src/parse/entities/program-required-file.entity';

export class FileIngestionRulesMock extends FileIngestionRulesEntity {
  constructor(program: string) {
    super();
    this.id = faker.string.uuid();
    this.program = program;
    this.requiredFiles = [];
  }

  public assignRequiredFile(filename: string, fileType: FileTypes) {
    const requiredFile = new ProgramRequiredFileMock(
      filename,
      fileType,
      this
    ) as ProgramRequiredFileEntity;
    this.requiredFiles.push(requiredFile);
  }
}
