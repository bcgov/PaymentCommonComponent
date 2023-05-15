import { FileMetadata } from './../../../src/common/columns/metadata';
import { FileTypes, Ministries } from './../../../src/constants';

export const generateMetadataMock = (filetype: FileTypes): FileMetadata => {
  return {
    source_file_name: filetype.toString(),
    date_uploaded: new Date(),
    source_file_length: 0,
    source_file_line: 0,
    program: Ministries.SBC,
  };
};
