import { parse, subBusinessDays } from 'date-fns';
import { Ministries } from '../constants';

/**
 *  Extract the file metatdata for the file date from the title
 * @param fileName
 * @returns
 */
export const extractDateFromBCMFileName = (fileName: string): Date => {
  const date = fileName.split('/')[1].split('.')[0].split('_')[3];
  const year = date.substring(0, 4);
  const month = date.substring(4, 6);
  const day = date.substring(6, 8);
  return new Date(`${year}-${month}-${day}`);
};

export const setReconciliationDates = (
  event: unknown,
  maxNumDaysToReconcile: number
) => {
  const parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;

  if (parsedEvent.reconciliationEventOverride) {
    return {
      reconciliationMinDate: parse(
        parsedEvent.period.from,
        'yyyy-MM-dd',
        new Date()
      ),
      reconciliationMaxDate: parse(
        parsedEvent.period.to,
        'yyyy-MM-dd',
        new Date()
      ),
      currentDate: parse(parsedEvent.period.to, 'yyyy-MM-dd', new Date()),
      ministry: parsedEvent.program,
      byPassFileValidity: parsedEvent.byPassFileValidity ?? false,
    };
  }
  const reconciliationMaxDate = subBusinessDays(new Date(), 1);
  const reconciliationMinDate = subBusinessDays(
    reconciliationMaxDate,
    maxNumDaysToReconcile
  );
  return {
    reconciliationMinDate,
    reconciliationMaxDate: subBusinessDays(new Date(), 1),
    currentDate: new Date(),
    ministry: Ministries.SBC,
    byPassFileValidity: false,
  };
};

/**
 * Extract the file date from the file name
 */
export const extractDateFromTXNFileName = (fileName: string): Date => {
  const name = fileName.split('/')[1].split('.')[0];
  const date = name.replace('SBC_SALES_', '').replace(/[_]/gi, '-');
  return new Date(date.slice(0, 10));
};
