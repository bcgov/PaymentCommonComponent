# Troubelshooting and Security

## Error Handling
If an error occurs during the processing of a transaction file, the Transaction API returns a 400 Bad Request status code, along with a JSON response that includes a list of errors encountered during processing. If an error occurs during the generation of the daily report, the API returns a 500 Internal Server Error status code.