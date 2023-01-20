SELECT deposit_date,
       l.location_id,
	   CASE WHEN currency = '' THEN 'CAD' ELSE currency END,
	   deposit_amt_curr
FROM cash_deposit cd JOIN "location" l ON cd.location_id + 20800 = l.pt_location_id
INTERSECT
SELECT transaction_date,
       "location",
	   currency,
	   SUM(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p."method"
	           JOIN "transaction" t ON t.transaction_id = p."transaction"
WHERE pm.description IN ('CASH', 'CHEQUE')
GROUP BY transaction_date, "location", currency
HAVING SUM(amount) <> 0