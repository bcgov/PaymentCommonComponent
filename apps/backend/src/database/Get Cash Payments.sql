SELECT transaction_date, location_id, currency, SUM(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p.method
	           JOIN transaction t ON t.id = p.transaction
WHERE pm.description IN ('CASH', 'CHEQUE')
GROUP BY transaction_date, location_id, currency
--HAVING SUM(amount) <> 0
ORDER BY transaction_date, location_id, currency