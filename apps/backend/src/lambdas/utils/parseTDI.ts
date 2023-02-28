import { FileTypes } from '../../constants';
import { TDI17Details, TDI34Details, DDFDetails } from '../../flat-files';

export const parseTDI = (
  type: string,
  program: string,
  fileName: string,
  fileContents: string
): TDI34Details[] | TDI17Details[] | DDFDetails[] | [] => {
  const lines = fileContents?.split('\n').filter((l: string) => l);
  lines.splice(0, 1);
  lines.splice(lines.length - 1, 1);

  if (lines.length === 0) {
    return [];
  }

  const items = ((): TDI34Details[] | TDI17Details[] | DDFDetails[] | [] => {
    if (type === FileTypes.TDI17)
      return lines.map(() => {
        return new TDI17Details({});
      });
    if (type === FileTypes.TDI34)
      return lines.map(() => {
        return new TDI34Details({});
      });
    if (type === FileTypes.DDF)
      return lines.map(() => {
        return new DDFDetails({});
      });
    return [];
  })();

  // TODO: We don't check what the intput type is for the actual parsing!
  const detailsArr = items.map((item, index) => {
    item.convertToJson(lines[index]);
    item.metadata = {
      type: type,
      source_file_line: index + 1,
      program,
      source_file_name: fileName,
      source_file_length: lines.length
    };
    return item;
  });

  const typedTDArray = detailsArr as
    | TDI34Details[]
    | TDI17Details[]
    | DDFDetails[];
  return typedTDArray;
};
