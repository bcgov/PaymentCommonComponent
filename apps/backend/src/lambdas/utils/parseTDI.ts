import Decimal from 'decimal.js';
import { ParseArgsTDI, FileTypes } from '../../constants';
import { TDI17Details, TDI34Details, DDFDetails } from '../../flat-files';
import { TDI17Header } from '../../flat-files/tdi17/TDI17Header';
import { TDI17Trailer } from '../../flat-files/tdi17/TDI17Trailer';
import { TDI34Header } from '../../flat-files/tdi34/TDI34Header';
import { TDI34Trailer } from '../../flat-files/tdi34/TDI34Trailer';

export const parseTDIHeader = (
  type: FileTypes,
  fileContents: string
): TDI34Header | TDI17Header => {
  // Validate header
  const lines = fileContents.split('\n').filter((l: string) => l);
  const header = lines.slice(0, 1);
  let headerLine;

  if (type === FileTypes.TDI17) {
    headerLine = new TDI17Header({});
    headerLine.convertToJson(header[0]);
  } else if (type === FileTypes.TDI34) {
    headerLine = new TDI34Header({});
    headerLine.convertToJson(header[0]);
  }

  const typedTDArray = headerLine as TDI34Header | TDI17Header;

  return typedTDArray;
};

export const parseTDI = ({
  type,
  fileName,
  program,
  fileContents,
  header,
}: ParseArgsTDI): TDI34Details[] | TDI17Details[] | DDFDetails[] | [] => {
  const lines = fileContents.split('\n').filter((l: string) => l);
  lines.splice(0, 1);
  const footer = lines.splice(lines.length - 1, 1);

  if (lines.length === 0) {
    return [];
  }

  // parse the body of the file
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

  // TODO [CCFPCM-397] We don't check what the intput type is for the actual parsing!
  const detailsArr = items.map((item, index) => {
    item.convertToJson(lines[index]);
    item.metadata = {
      type: type,
      source_file_line: index + 1,
      program,
      source_file_name: fileName,
      source_file_length: lines.length,
      file_created_date:
        type === FileTypes.TDI34
          ? (header as TDI34Header).settlement_date
          : (header as TDI17Header).creation_date,
    };
    return item;
  });

  // Validate trailer
  let itemTotals = new Decimal(0);
  let footerLine: TDI17Trailer | TDI34Trailer | undefined;
  if (type === FileTypes.TDI17) {
    footerLine = new TDI17Trailer({});
    footerLine.convertToJson(footer[0]);
    itemTotals = (detailsArr as TDI17Details[]).reduce(
      (acc: Decimal, item: TDI17Details) => {
        return acc.plus(new Decimal(item.deposit_amt_cdn));
      },
      new Decimal(0)
    );
    if (parseInt(footerLine.no_of_details) !== detailsArr.length) {
      throw new Error(
        `TDI17 Validation failed for ${fileName}. Number of records does not match file footer.`
      );
    }
    if (!new Decimal(footerLine.deposit_amt_cdn).equals(itemTotals)) {
      throw new Error(
        `TDI17 Validation failed for ${fileName}. Total amount in footer does not match itemized line amounts.`
      );
    }
  } else if (type === FileTypes.TDI34) {
    footerLine = new TDI34Trailer({});
    footerLine.convertToJson(footer[0]);
    itemTotals = (detailsArr as TDI34Details[]).reduce(
      (acc: Decimal, item: TDI34Details) => {
        // The trailer in TDI34 does not seem to account for negative values
        return acc.plus(new Decimal(Math.abs(item.transaction_amt)));
      },
      new Decimal(0)
    );
    if (parseInt(footerLine.no_of_detail_rcd) !== detailsArr.length) {
      throw new Error(
        `TDI34 Validation failed for ${fileName}. Number of records does not match file footer.`
      );
    }
    if (!new Decimal(footerLine.transaction_amt).equals(itemTotals)) {
      throw new Error(
        `TDI34 Validation failed for ${fileName}. Total amount in footer does not match itemized line amounts.`
      );
    }
  }

  const typedTDArray = detailsArr as
    | TDI34Details[]
    | TDI17Details[]
    | DDFDetails[];
  return typedTDArray;
};
