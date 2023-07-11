import { faker } from '@faker-js/faker';
import { FileTypes } from '../../../src/constants';
import { FileUploadedEntity } from '../../../src/uploads/entities/file-uploaded.entity';

export class FileUploadedMock extends FileUploadedEntity {
  constructor(sourceFileType: FileTypes, sourceFileName: string, date?: Date) {
    super();
    this.id = faker.datatype.uuid();
    this.created_at = date || faker.date.past();
    this.sourceFileType = sourceFileType;
    this.sourceFileName = sourceFileName;
    this.sourceFileLength = faker.datatype.number();
  }
}
