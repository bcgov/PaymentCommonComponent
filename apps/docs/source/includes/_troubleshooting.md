# Troubleshooting and Security

## Error Handling
Common Component for Payments uses conventional HTTP response codes to indicate the success or failure of an API request. Codes in the 2xx range indicate success. Codes in the 4xx range indicate an error that failed given the information provided, returning a JSON response that includes a list of errors encountered during processing. Codes in the 5xx range indicate an error with the server.

![Errors](../images/HTTPerrors.png?raw=true "Errors")