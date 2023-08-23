/*eslint-disable @typescript-eslint/no-explicit-any*/
/*eslint-disable @typescript-eslint/no-unused-vars*/
import { Inject, Injectable } from '@nestjs/common';
import { format, parse } from 'date-fns';
import * as Excel from 'exceljs';
import { PassThrough, Stream } from 'stream';
import { AppLogger } from '../logger/logger.service';
import { Placement } from '../reporting/interfaces';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

@Injectable()
export class ExcelExportService {
  private workbook: Excel.stream.xlsx.WorkbookWriter;
  private stream: PassThrough;

  constructor(
    @Inject(S3ManagerService) private readonly s3Manager: S3ManagerService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(ExcelExportService.name);
    this.stream = new Stream.PassThrough();
    this.workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream: this.stream,
      useStyles: true,
      useSharedStrings: true,
    });
  }
  /**
   *
   * @param filename
   * @param date
   */

  public async saveS3(filename: string, date: string): Promise<void> {
    this.appLogger.log('Saving to S3 Bucket');
    this.workbook.commit();

    try {
      await this.s3Manager.upload({
        Key: `${filename}_${date}.xlsx`,
        Bucket: `pcc-recon-reports-${process.env.RUNTIME_ENV}`,
        Body: this.stream,
        ContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } catch (error) {
      this.appLogger.error(`${error}`);
    }
  }

  /**
   *
   * @param title
   */
  public addWorkbookMetadata(title: string): void {
    const date = parse(
      format(new Date(), 'yyyy-MM-dd'),
      'yyyy-MM-dd',
      new Date()
    );
    this.workbook.title = title;
    this.workbook.created = date;
    this.appLogger.log(
      `New ${title} workbook created on: ${format(date, 'yyyy-MM-dd')}`
    );
  }
  public commitWorksheet(sheetName: string): void {
    this.workbook.getWorksheet(sheetName).commit();
  }
  /**
   *
   *
   * @param name
   */
  public addSheet(name: string): void {
    this.workbook.addWorksheet(name);
    this.appLogger.log(`New ${name} worksheet added`);
  }
  /**
   *
   * @param sheetName
   * @param style
   * @param placement
   */

  public addTitleRow(
    sheetName: string,
    date: string,
    style: Partial<Excel.Style>,
    placement: Placement
  ): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    const rowOne = sheet.getRow(1);
    /* Workaround as Header/Footer cannot be added in the way the docs describe - known bug in exceljs https://github.com/exceljs/exceljs/issues/1325 */
    sheet.mergeCells(placement.merge);

    rowOne.height = 20;

    rowOne.font = {
      bold: true,
      size: 16,
    };

    rowOne.values = [`${sheetName} ${date}`];

    rowOne.commit();

    this.appLogger.log(`Title added and formatted to sheet ${sheetName}`);
  }
  /**
   *
   * @param sheetName
   * @param rowData
   * @param startIndex
   */
  public addRows(sheetName: string, rowData: any[], options?: any): void {
    const sheet = this.workbook.getWorksheet(sheetName);
    rowData.forEach((row, index) => {
      const uncommittedRow = sheet.getRow(index + 2);

      uncommittedRow.values = row.values;

      uncommittedRow.eachCell((cell, _colNumber) => {
        const unformattedCell = sheet.getCell(cell.address);
        if (cell.type === 4) {
          unformattedCell.style = { ...row.style, numFmt: 'yyyy/mm/dd' };
        } else {
          unformattedCell.style = row.style;
        }
      });

      uncommittedRow.alignment = {
        horizontal: 'right',
      };

      //commit row - cannot edit after commit
      uncommittedRow.commit();
    });
    this.appLogger.log(
      `${rowData.length} rows added and formatted to sheet ${sheetName}`
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
    sheet.columns.forEach((column) => {
      column.width = 20;
      column.font = {
        name: 'Calibri',
        color: { argb: '1A000000' },
        family: 2,
        size: 12,
        italic: false,
        bold: true,
      };
    });
    // do not commit this row as formatting will need to be added after - this row will be commited when the worksheet is commited
    this.appLogger.log(`Columns added and formatted to sheet ${sheetName}`);
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
    this.appLogger.log(`Filter options added to sheet ${sheetName}`);
  }
}
