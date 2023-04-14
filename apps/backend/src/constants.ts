export const ALL = 'all';

export enum Ministries {
  SBC = 'SBC',
  LABOUR = 'LABOUR'
}

export enum FileTypes {
  TDI17 = 'TDI17',
  TDI34 = 'TDI34',
  DDF = 'DDF',
  SBC_SALES = 'SBC_SALES'
}

export enum FileNames {
  TDI17 = 'F08TDI17',
  TDI34 = 'F08TDI34',
  SBC_SALES = 'SBC_SALES'
}

export interface ParseArgsTDI {
  type: FileTypes;
  fileName: string;
  program: string;
  fileContents: string;
}

export interface DateRange {
  from_date: Date;
  to_date: Date;
}
