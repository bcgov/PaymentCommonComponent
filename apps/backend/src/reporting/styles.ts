import * as Excel from 'exceljs';
import { MatchStatus } from '../common/const';

export const fontStyle: Partial<Excel.Font> = {
  name: 'Calibri',
  color: { argb: '1A000000' },
  family: 2,
  size: 12,
  italic: false,
  bold: false
};

export const borderStyle: Partial<Excel.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

export const dailySummarySheetHeaderStyle: Partial<Excel.Style> = {
  font: {
    ...fontStyle,
    bold: true
  },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  },
  border: borderStyle
};

export const rowStyle = (status: MatchStatus): Partial<Excel.Style> => {
  switch (status) {
    case MatchStatus.EXCEPTION:
      return {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1AE78587' }
        },
        font: fontStyle,
        border: borderStyle
      };
    case MatchStatus.MATCH:
      return {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1AACD1AF' }
        },
        font: fontStyle,
        border: borderStyle
      };
    case MatchStatus.IN_PROGRESS:
      return {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1AFFFFA7' }
        },
        font: fontStyle,
        border: borderStyle
      };
    case MatchStatus.PENDING:
    default:
      return {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }
        },
        font: fontStyle,
        border: borderStyle
      };
  }
};
