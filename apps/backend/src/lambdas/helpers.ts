import { format } from 'date-fns';
import { FileTypes, Ministries } from '../constants';
import { NotificationService } from '../notification/notification.service';
import { FileUploadedEntity } from '../parse/entities/file-uploaded.entity';
import { ParseService } from '../parse/parse.service';

export const sbcDateFromFileName = (filename: string): string => {
  const name = filename.split('/')[1].split('.')[0];
  const date = name.replace('SBC_SALES_', '').replace(/[_]/gi, '');

  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
};

export const bcmDateFromFileName = (filename: string): string => {
  const name = filename.split('/')[1].split('.')[0].split('_')[3];

  return `${name.slice(0, 4)}-${name.slice(4, 6)}-${name.slice(6, 8)}`;
};

//TODO - ministry dynamically
export const getFilesUploadedByFileName = async (
  parseService: ParseService,
  reconciliationDate: Date
): Promise<boolean> => {
  const date = format(reconciliationDate, 'yyyy-MM-dd');

  const files = await parseService.findAllUploadedFiles();

  const sbcFiles = files.filter(
    (f: FileUploadedEntity) => f.sourceFileType === FileTypes.SBC_SALES
  );

  const bcmFiles = files
    .filter((f: FileUploadedEntity) => f.sourceFileType !== FileTypes.SBC_SALES)
    .filter((f: FileUploadedEntity) => !f.sourceFileName.includes('LABOUR'))
    .filter((f: FileUploadedEntity) => !f.sourceFileName.includes('LABOUR2'))
    .filter((f: FileUploadedEntity) => !f.sourceFileName.includes('FebMarApr'));

  const hasSBCFileToday = sbcFiles.filter(
    (f: FileUploadedEntity) => sbcDateFromFileName(f.sourceFileName) === date
  );

  const hasTDI34FileToday = bcmFiles
    .filter((f: FileUploadedEntity) => f.sourceFileType === FileTypes.TDI34)
    .filter(
      (f: FileUploadedEntity) => bcmDateFromFileName(f.sourceFileName) === date
    );

  const hasTDI17FileToday = bcmFiles
    .filter((f: FileUploadedEntity) => f.sourceFileType === FileTypes.TDI34)
    .filter(
      (f: FileUploadedEntity) => bcmDateFromFileName(f.sourceFileName) === date
    );
  if (
    hasSBCFileToday.length === 0 ||
    hasTDI34FileToday.length === 0 ||
    hasTDI17FileToday.length === 0
  ) {
    throw new Error(
      `Incomplete dataset for this date ${reconciliationDate}. Please check the uploaded files.`
    );
  }
  return true;
};

// PrsnsEvent reconciler from running for a program if no valid files today
export const checkFilesUploadedToday = async (
  notificationService: NotificationService,
  ministry: Ministries
): Promise<boolean> => {
  const rule = await notificationService.getRulesForProgram(ministry);
  if (!rule) {
    throw new Error('No rule for this program');
  }
  const reconciliationDate = new Date();
  const daily = await notificationService.getDailyForRule(
    rule,
    reconciliationDate
  );
  if (!daily?.success) {
    throw new Error(
      `Incomplete dataset for this date ${reconciliationDate}. Please check the uploaded files.`
    );
  }
  return true;
};
