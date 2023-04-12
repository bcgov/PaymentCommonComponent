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

export const columnStyle: Partial<Excel.Style> = {
  font: {
    ...fontStyle,
    bold: true
  }
};
export const rowCommonStyle: Partial<Excel.Style> = {
  font: { ...fontStyle }
};

export const rowStyle = (exceptions?: boolean): Partial<Excel.Style> => {
  if (exceptions) {
    return {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1AE78587' }
      },
      font: { ...fontStyle }
    };
  }
  return rowCommonStyle;
};
