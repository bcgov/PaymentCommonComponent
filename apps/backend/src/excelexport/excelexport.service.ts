import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Excel from 'exceljs';
import * as path from 'path';
import { AppLogger } from '../logger/logger.service';
@Injectable()
export class ExcelexportService {
  private workbook: Excel.Workbook;

  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {
    this.workbook = new Excel.Workbook();
  }

  public async saveLocal(): Promise<void> {
    try {
      const file = path.resolve(__dirname, '../../report.xlsx');
      const write = await this.workbook.xlsx.writeFile(file);
      this.appLogger.log(write);
    } catch (e) {
      this.appLogger.error(e);
    }
  }

  public addSheet(name: string): void {
    this.workbook.addWorksheet(name);
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public addRow(sheetName: string, rowData: any[]): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    sheet.addRow(rowData);
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public addColumn(sheetName: string, columnData: any[]): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    sheet.columns.push({ header: 'New Column', key: 'newColumn', width: 20 });
    sheet.getColumn('newColumn').values = columnData;
  }
}
