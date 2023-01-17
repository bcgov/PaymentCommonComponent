import { TDI17Details, TDI34Details, DDFDetails } from '../../flat-files';

export const parseTDI = (
  type: string,
  fileContents: string,
  program: string,
  fileName: string
) => {
  const lines = fileContents?.split('\n').filter((l: string) => l);

  lines.splice(0, 1);
  lines.splice(lines.length - 1, 1);

  if (lines.length === 0) {
    return;
  }
  const detailsArr: (TDI34Details | TDI17Details | DDFDetails)[] = lines.map(
    (line: string) => {
      const details =
        type === 'DDF'
          ? new DDFDetails({})
          : type === 'TDI17'
          ? new TDI17Details({})
          : new TDI34Details({});
      details.convertToJson(line);
      details.metadata = {
        type: type,
        source_file_line: lines.indexOf(line) + 1,
        program: program.toUpperCase(),
        source_file_name: fileName,
        source_file_length: lines.length
      };
      return details;
    }
  );
  return detailsArr.map((itm: { resource: unknown }) => itm.resource);
};
