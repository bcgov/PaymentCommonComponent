import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { FileMetadata } from '../../common/columns';
import { ParseArgsTDI, FileTypes } from '../../constants';
import { TDI17Details, TDI34Details } from '../../flat-files';
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
    headerLine = new TDI17Header({} as TDI17Header);
    headerLine.convertToJson(header[0]);
  } else if (type === FileTypes.TDI34) {
    headerLine = new TDI34Header({} as TDI34Header);
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
}: ParseArgsTDI): TDI34Details[] | TDI17Details[] | [] => {
  const lines = fileContents.split('\n').filter((l: string) => l);
  lines.splice(0, 1);
  const footer = lines.splice(lines.length - 1, 1);
  if (lines.length === 0) {
    return [];
  }
  // parse the body of the file
  const items = ((): TDI34Details[] | TDI17Details[] | [] => {
    switch (type) {
      case FileTypes.TDI17:
        return lines.map(() => {
          return new TDI17Details({} as TDI17Details);
        });
      case FileTypes.TDI34:
        return lines.map(() => {
          return new TDI34Details({} as TDI34Details);
        });
      default:
        return [];
    }
  })();

  const detailsArr = items.map((item, index) => {
    item.convertToJson(lines[index]);
    item.metadata = new FileMetadata({
      source_file_line: index + 1,
      program,
      source_file_name: fileName,
      source_file_length: lines.length,
      parsed_on:
        type === FileTypes.TDI34
          ? (header as TDI34Header).settlement_date
          : (header as TDI17Header).creation_date,
    });
    return item;
  });

  // Validate trailer

  let footerLine: TDI17Trailer | TDI34Trailer | undefined;
  if (type === FileTypes.TDI17) {
    footerLine = new TDI17Trailer({} as TDI17Trailer);
    footerLine.convertToJson(footer[0]);
    const itemTotals = (detailsArr as TDI17Details[]).reduce(
      (acc: Decimal, item: TDI17Details) => {
        return acc.plus(new Decimal(item.deposit_amt_cdn));
      },
      new Decimal(0)
    );
    if (parseInt(footerLine.no_of_details) !== detailsArr.length) {
      throw new BadRequestException(
        `TDI17 Validation failed for ${fileName}. Number of records does not match file footer.`
      );
    }
    if (!new Decimal(footerLine.deposit_amt_cdn).equals(itemTotals)) {
      throw new BadRequestException(
        `TDI17 Validation failed for ${fileName}. Total amount in footer does not match itemized line amounts.`
      );
    }
  } else if (type === FileTypes.TDI34) {
    footerLine = new TDI34Trailer({} as TDI34Trailer);
    footerLine.convertToJson(footer[0]);
    const itemTotals = (detailsArr as TDI34Details[]).reduce(
      (acc: Decimal, item: TDI34Details) => {
        // The trailer in TDI34 does not seem to account for negative values
        return acc.plus(Math.abs(item.transaction_amt));
      },
      new Decimal(0)
    );
    if (parseInt(footerLine.no_of_detail_rcd) !== detailsArr.length) {
      throw new BadRequestException(
        `TDI34 Validation failed for ${fileName}. Number of records does not match file footer.`
      );
    }
    if (!new Decimal(footerLine.transaction_amt).equals(itemTotals)) {
      throw new BadRequestException(
        `TDI34 Validation failed for ${fileName}. Total amount in footer does not match itemized line amounts.`
      );
    }
  }

  const typedTDArray = detailsArr as TDI34Details[] | TDI17Details[];
  return typedTDArray;
};
