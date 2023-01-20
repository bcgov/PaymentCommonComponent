SELECT
	transaction_date,
	l.location_id,
	card_vendor,
	transaction_amt,
	COUNT(transaction_amt)
FROM pos_deposit pd
	JOIN "location" l ON pd.merchant_id = l.merchant_id
GROUP BY transaction_date, l.location_id, card_vendor, transaction_amt