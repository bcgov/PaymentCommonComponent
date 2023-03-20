import * as Excel from 'exceljs';
import { Placement } from './interfaces';

export const fontStyle: Partial<Excel.Font> = {
  name: 'Calibri',
  color: { argb: '1A000000' },
  family: 2,
  size: 12,
  italic: false,
  bold: false
};

export const titleStyle: Partial<Excel.Style> = {
  font: {
    ...fontStyle,
    size: 16,
    bold: true
  }
};

export const placement = (mergeRange: string): Placement => {
  return {
    row: 1,
    column: 'A1',
    height: 40,
    merge: mergeRange
  };
};

export const borderStyle: Partial<Excel.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

export const columnStyle: Partial<Excel.Style> = {
  font: {
    ...fontStyle,
    bold: true
  },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  },
  border: { ...borderStyle }
};
export const rowCommonStyle: Partial<Excel.Style> = {
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  },
  font: { ...fontStyle },
  border: { ...borderStyle }
};

export const rowStyle = (exceptions?: boolean): Partial<Excel.Style> => {
  if (exceptions) {
    return {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1AE78587' }
      },
      font: { ...fontStyle },
      border: { ...borderStyle }
    };
  }
  return rowCommonStyle;
};
