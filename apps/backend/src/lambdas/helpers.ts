import { parse, subBusinessDays } from 'date-fns';
import { Ministries } from '../constants';
/**
 * Allows for manual override of the reconciliation dates
 * @param event
 * @param numDaysToReconcile
 * @returns
 */
export const configureReconciliationInputs = (
  event: unknown,
  numDaysToReconcile: number
) => {
  const parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;
  // check if the event has a reconciliationEventOverride property
  if (parsedEvent.reconciliationEventOverride) {
    return {
      reconciliationMinDate: parsedEvent.period.from,
      reconciliationMaxDate: parsedEvent.period.to,
      //TO prevent the report from being generated with the entire dataset in case of a batch reconciliation, we will use the max date from the input parameters as the date of reconciliation
      //These overrides are only for testing purposes and should not be used outside of dev/test
      currentDate: parse(parsedEvent.period.to, 'yyyy-MM-dd', new Date()),
      ministry: parsedEvent.program,
      byPassFileValidity: parsedEvent.byPassFileValidity ?? false,
    };
  }
  const currentDate = new Date();
  // min date and max date for reconciliation set how far back we will look at the data that is unmatched and attempt to match it
  // by default, look back 31 bus days from the current date
  const reconciliationMinDate = subBusinessDays(
    currentDate,
    numDaysToReconcile
  );
  // if no override, then use the default values
  // TODO make the ministry dynamic
  return {
    reconciliationMinDate,
    reconciliationMaxDate: currentDate,
    currentDate,
    ministry: Ministries.SBC,
    byPassFileValidity: false,
  };
};

/**
 * Extract the file date from the file name
 * exmaple filename: 'sbc/SBC_SALES_2026_03_03_23_17_37.JSON'
 */
export const extractDateFromTXNFileName = (fileName: string): string => {
  const name = fileName.split('/')[1].split('.')[0];
  const date = name.replace('SBC_SALES_', '').replace(/[_]/gi, '-');
  return date.slice(0, 10);
};
/**
 * Validates the filename from SBC Garms. Example filename: 'sbc/SBC_SALES_2026_03_03_23_17_37.JSON',
 * @param filename
 * @returns
 *
 */
export const validateSbcGarmsFileName = (filename: string): boolean => {
  try {
    return /sbc\/\SBC_SALES_(20)\d{2}_(0[1-9]|1[0-2])_(0[1-9]|[12][0-9]|3[01])_\d{2}_\d{2}_\d{2}.JSON/gi.test(
      filename
    );
  } catch (err) {
    throw new Error(`Error validating file name: ${filename}`);
  }
};
