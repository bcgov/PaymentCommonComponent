import { Inject, Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import * as Excel from 'exceljs';
import * as path from 'path';
import { Stream } from 'stream';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
@Injectable()
export class ExcelExportService {
  private workbook: Excel.Workbook;

  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(S3ManagerService) private readonly s3Manager: S3ManagerService
  ) {
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

  public async saveS3(filename: string): Promise<void> {
    try {
      const stream = new Stream.PassThrough();

      this.workbook.xlsx
        .write(stream)
        .then(() => {
          return this.s3Manager.s3
            .upload({
              Key: `${filename}.xlsx`,
              Bucket: `pcc-recon-reports-${process.env.RUNTIME_ENV}`,
              Body: stream,
              ContentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            .promise();
        })
        .then(() => {
          console.log('uploaded');
        })
        .catch((e) => {
          console.log(e.message);
        });
    } catch (e) {
      this.appLogger.error(e);
    }
  }

  public generateWorkbook(title: string): void {
    this.workbook.title = title;
    this.workbook.created = new Date(format(new Date(), 'yyyy, MM, dd'));
  }

  public addSheet(name: string): void {
    this.workbook.addWorksheet(name);
  }
  /*eslint-disable @typescript-eslint/no-unused-vars*/
  public addCellStyle(
    sheetName: string,
    rowNumber: number,
    style: Partial<Excel.Style>
  ): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell, _colNumber) => {
      sheet.getCell(cell.address).style = style;
    });
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public addRows(sheetName: string, rowData: any[]): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    rowData.forEach((row, index) => {
      sheet.insertRow(index + 2, row.values);
      sheet.getRow(index + 2).commit();
      if (row.style) {
        this.addCellStyle(sheetName, index + 2, row.style);
      }
    });
  }

  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public addColumns(
    sheetName: string,
    columnData: any[],
    style?: Partial<Excel.Style>
  ): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    sheet.columns = columnData;
    sheet.columns.forEach((column) => (column.width = 20));
    if (style) {
      this.addCellStyle(sheetName, 1, style);
    }
  }
}
