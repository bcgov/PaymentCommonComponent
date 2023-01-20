SELECT transaction_date,
       "location",
       card_vendor,
	   amount,
	   COUNT(amount)
FROM payment p JOIN payment_method pm ON pm.garms_code = p."method"
	           JOIN "transaction" t ON t.transaction_id = p."transaction"
WHERE pm.card_vendor is not null and pm.card_vendor <> ''
GROUP BY transaction_date, "location", card_vendor, amount