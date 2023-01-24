SELECT transaction_date,
       "location",
       card_vendor,
	   amount,
	   COUNT(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p."method"
	           JOIN "transaction" t ON t.transaction_id = p."transaction"
WHERE pm.card_vendor IS NOT NULL AND pm.card_vendor <> ''
  AND p."match" = FALSE
GROUP BY transaction_date, "location", card_vendor, amount