/*eslint-disable @typescript-eslint/no-explicit-any*/
/*eslint-disable @typescript-eslint/no-unused-vars*/
import { Inject, Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import * as Excel from 'exceljs';
import * as path from 'path';
import { Stream } from 'stream';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { Placement } from './../reporting/interfaces';

@Injectable()
export class ExcelExportService {
  private workbook: Excel.Workbook;

  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(S3ManagerService) private readonly s3Manager: S3ManagerService
  ) {
    this.workbook = new Excel.Workbook();
  }

  /**
   * @description Save workbook to local file system
   */

  public async saveLocal(): Promise<void> {
    try {
      const file = path.resolve(__dirname, '../../report.xlsx');
      const write = await this.workbook.xlsx.writeFile(file);
      this.appLogger.log(write, ExcelExportService.name);
    } catch (e) {
      this.appLogger.error(`${e}`, ExcelExportService.name);
    }
  }
  /**
   *
   * @param filename
   * @param date
   */

  public async saveS3(filename: string, date: string): Promise<void> {
    try {
      const stream = new Stream.PassThrough();

      this.workbook.xlsx
        .write(stream)
        .then(() => {
          return this.s3Manager.s3
            .upload({
              Key: `${filename}${date}.xlsx`,
              Bucket: `pcc-recon-reports-${process.env.RUNTIME_ENV}`,
              Body: stream,
              ContentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            .promise();
        })
        .then(() => {
          this.appLogger.log(
            `Uploaded ${filename} to S3 bucket`,
            ExcelExportService.name
          );
        })
        .catch((e) => {
          this.appLogger.error(`${e}`, ExcelExportService.name);
        });
    } catch (e) {
      this.appLogger.error(`${e}`, ExcelExportService.name);
    }
  }
  /**
   *
   * @param title
   */
  public addWorkbookMetadata(title: string): void {
    const date = new Date(format(new Date(), 'yyyy-MM-dd'));
    this.workbook.title = title;
    this.workbook.created = date;
    this.appLogger.log(
      `New ${title} workbook created on: ${date}`,
      ExcelExportService.name
    );
  }
  /**
   *
   * @param name
   */
  public addSheet(name: string): void {
    this.workbook.addWorksheet(name);
    this.appLogger.log(`New ${name} worksheet added`, ExcelExportService.name);
  }
  /**
   *
   * @param sheetName
   * @param style
   * @param placement
   */

  public addTitleRow(
    sheetName: string,
    style: Partial<Excel.Style>,
    placement: Placement
  ): void {
    const sheet = this.workbook.getWorksheet(sheetName);

    /* Splice in order to insert a title/header - known bug in exceljs https://github.com/exceljs/exceljs/issues/1325 */
    sheet.spliceRows(1, 0, new Array(3));

    sheet.mergeCells(placement.merge);

    sheet.getCell(placement.column).value = sheetName;
    sheet.getCell(placement.column).style = style;
  }

  /**
   *
   * @param sheetName
   * @param rowNumber
   * @param style
   */
  public addRowStyle(
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
  /**
   *
   * @param sheetName
   * @param rowData
   * @param startIndex
   */
  public addRows(sheetName: string, rowData: any[], startIndex: number): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    rowData.forEach((row, index) => {
      sheet.insertRow(index + startIndex, row.values);
      sheet.getRow(index + startIndex).commit();
      if (row.style) {
        this.addRowStyle(sheetName, index + startIndex, row.style);
      }
    });

    this.appLogger.log(
      `${rowData.length} rows added and formatted to sheet ${sheetName}`,
      ExcelExportService.name
    );
  }
  /**
   *
   * @param sheetName
   * @param columnData
   */
  public addColumns(sheetName: string, columnData: any[]): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    sheet.columns = columnData;
    sheet.columns.forEach((column) => (column.width = 20));
    this.appLogger.log(
      `${sheet.columns.length} columns added and formatted to sheet ${sheetName}`,
      ExcelExportService.name
    );
  }
  /**
   *
   * @param sheetName
   * @param filterOptions
   */
  public addFilterOptions(
    sheetName: string,
    filterOptions: Excel.AutoFilter
  ): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    sheet.autoFilter = filterOptions;
    this.appLogger.log(
      `Filter options added to sheet ${sheetName}`,
      ExcelExportService.name
    );
  }
}
