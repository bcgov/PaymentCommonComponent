SELECT transaction_date,
       "location",
	   currency,
	   SUM(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p."method"
	           JOIN "transaction" t ON t.transaction_id = p."transaction"
WHERE pm.description IN ('CASH', 'CHEQUE')
  AND p."match" = FALSE
GROUP BY transaction_date, "location", currency
HAVING SUM(amount) <> 0
ORDER BY transaction_date, "location", currency