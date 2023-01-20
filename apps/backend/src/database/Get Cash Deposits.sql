SELECT deposit_date,
       garms_location_id,
	   CASE WHEN currency = '' THEN 'CAD' ELSE currency END,
	   deposit_amt_curr
FROM cash_deposit d JOIN location l ON d.location_id + 20000 = l.pt_location_id
ORDER BY deposit_date, garms_location_id, currency