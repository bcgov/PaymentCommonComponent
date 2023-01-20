SELECT deposit_date,
       l.location_id,
	   CASE WHEN currency = '' THEN 'CAD' ELSE currency END,
	   deposit_amt_curr
FROM cash_deposit cd JOIN "location" l ON cd.location_id + 20800 = l.pt_location_id
ORDER BY deposit_date, l.location_id, currency