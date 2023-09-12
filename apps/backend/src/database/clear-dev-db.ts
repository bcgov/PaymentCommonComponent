import { Context } from 'aws-lambda';

import db from './datasource';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event?: unknown, _context?: Context) => {
  console.log('Initializing lambda to clear dev database...');

  const checkEnv = () => {
    if (process.env.RUNTIME_ENV === 'dev') {
      return true;
    }
    if (process.env.RUNTIME_ENV === 'local') {
      return true;
    }
    return false;
  };

  if (!checkEnv) {
    return {
      statusCode: 403,
      message:
        'Execution of this lambda is not allowed in your current environment. Exiting..',
    };
  }

  try {
    if (!db.isInitialized) {
      await db.initialize();
    }

    const runner = db.createQueryRunner();
    console.log('Deleting payment table entries...');
    await runner.query(`DELETE FROM payment;`);
    console.log('...payment table cleared.\n');
    console.log('Deleting transaction table entries...');
    await runner.query(`DELETE FROM transaction;`);
    console.log('...transaction table cleared.\n');
    console.log('Deleting pos_deposit table entries...');
    await runner.query(`DELETE FROM pos_deposit;`);
    console.log('...pos Deposit table cleared.\n');
    console.log('Deleting cash_deposit table entries...');
    await runner.query(`DELETE FROM cash_deposit;`);
    console.log('...cash Deposit table cleared.\n');
    console.log(
      'Deleting payment_round_four_matches_pos_deposit table entries...'
    );
    await runner.query(`DELETE FROM payment_round_four_matches_pos_deposit;`);
    console.log('...payment Round Four Matches Pos Deposit table cleared.\n');
    console.log('Deleting file_uploaded table entries...');
    await runner.query(`DELETE FROM file_uploaded;`);
    console.log('...file Uploaded table cleared.\n');
    console.log('Deleting program_daily_upload table entries...');
    await runner.query(`DELETE FROM program_daily_upload;`);
    console.log('...program Daily Upload table cleared.\n');

    console.log('All Tables Cleared.');

    db.destroy();
    return 'success';
  } catch (e) {
    console.log(e);
    console.log('Action to clear database has failed.');
    return 'failure';
  }
};
