import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Excel from 'exceljs';
import * as path from 'path';
import { Stream } from 'stream';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
@Injectable()
export class ExcelexportService {
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
