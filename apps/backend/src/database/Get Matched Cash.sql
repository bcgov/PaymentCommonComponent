SELECT deposit_date,
       garms_location_id,
	   CASE WHEN currency = '' THEN 'CAD' ELSE currency END,
	   deposit_amt_curr
FROM cash_deposit d JOIN location l ON d.location_id + 20000 = l.pt_location_id
INTERSECT
SELECT transaction_date,
       location_id,
	   currency,
	   SUM(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p.method
	           JOIN transaction t ON t.id = p.transaction
WHERE pm.description IN ('CASH', 'CHEQUE')
GROUP BY transaction_date, location_id, currency
HAVING SUM(amount) <> 0