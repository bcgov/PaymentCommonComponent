import { LocationEntity } from './../location/entities/master-location-data.entity';
export const statsQuery = async (
  db: any,
  start_date: string,
  end_date: string
) => {
  return {
    cash_deposit: await db.query(`
      SELECT
    	COUNT(*),
    	SUM(deposit_amt_cdn)
      FROM
    	  cash_deposit
      WHERE
    	  program = 'SBC'
    	AND 
        deposit_date >= '${start_date}'::date
    	AND 
        deposit_date <= '${end_date}'::date
      AND 
        match=false
    `),

    cash_payment: await db.query(`
      SELECT
      COUNT(*),
      SUM(p.amount)
      FROM
         payment p 
      JOIN
        transaction t
      ON
        p.transaction=t.id
      WHERE
        t.fiscal_close_date >= '${start_date}'::date
      AND 
        t.fiscal_close_date <= '${end_date}'::date
      AND 
        p."method" not in ('AX', 'V', 'M', 'P')
      AND 
        match=false
      `),

    pos_deposit: await db.query(`
      SELECT
      COUNT(*),
      SUM(transaction_amt::numeric)
      FROM
        pos_deposit
      WHERE
        program='SBC'
      AND        
        transaction_date >= '${start_date}'::date
      AND
        transaction_date <= '${end_date}'::date
      AND 
        match=false
      `),

    pos: await db.query(`
      SELECT
      COUNT(*),
      SUM(p.amount)
      FROM
        payment p
      JOIN
        transaction t
      ON
        p.transaction=t.id
      WHERE
        t.transaction_date >= '${start_date}'::date
      AND 
        t.transaction_date <= '${end_date}'::date
      AND 
        p."method" in ('AX', 'V', 'M', 'P')
      AND 
        match=false
      `)
  };
};

export const locations = async (db: any): Promise<LocationEntity[]> =>
  await db.query(`
    SELECT
    DISTINCT(location_id)
    FROM
      master_location_data mld
    WHERE
      source_id='SBC'
  `);
