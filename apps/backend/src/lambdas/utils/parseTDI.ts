import Decimal from 'decimal.js';
import { extractDateFromBCMFileName } from '../helpers';
import { ParseArgsTDI, FileTypes } from '../../constants';
import { TDI17Details, TDI34Details, DDFDetails } from '../../flat-files';
import { TDI17Trailer } from '../../flat-files/tdi17/TDI17Trailer';
import { TDI34Trailer } from '../../flat-files/tdi34/TDI34Trailer';

export const parseTDI = ({
  type,
  fileName,
  program,
  fileContents,
}: ParseArgsTDI): TDI34Details[] | TDI17Details[] | DDFDetails[] | [] => {
  const lines = fileContents.split('\n').filter((l: string) => l);
  lines.splice(0, 1);
  const footer = lines.splice(lines.length - 1, 1);

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

  // TODO [CCFPCM-397] We don't check what the intput type is for the actual parsing!
  const detailsArr = items.map((item, index) => {
    item.convertToJson(lines[index]);
    item.metadata = {
      type: type,
      source_file_line: index + 1,
      program,
      source_file_name: fileName,
      source_file_length: lines.length,
      file_created_date: extractDateFromBCMFileName(fileName),
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
