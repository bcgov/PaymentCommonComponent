# Developers
## Explore our APIs
Common Component for Payments' APIs power its platform to perform automated reconciliation of payments across the various lines of businesses across British Columbia. Behind these APIs is a software layer connecting and optimizing communications networks to allow your users to simplify and streamline the payment processes and technology across the BC government payment ecosystem.
## Before you begin
You must have one of the following accounts for login to the API Services Poratl:

1. Github

2. IDIR

3. BC Services Card

## Initial setup
Step 1: Navigate to the API Services Portal https://api.gov.bc.ca/

Step 2: Click on "For Developers"

Step 3: Scroll down and click on the "Payment" API directory

Step 4: Click on "Request Access"

Step 5: Click on "Login with IDIR"

Step 6: Enter your credentials and click "Continue"

Step 7: Click on "Create Application" and input any name in the field.

Step 8: Pick the desired environment.

Step 9: Click on "Request Access".

Step 10: Save your secret credentials (client id, secret, and token) in a safe place; otherwise they will be lost once the screen disappears. Do not get the credentials checked into a public Github repository. If credentials are lost, you can regenerate a new secret from the API Services Portal.

Step 11: Wait for your API Service Provider to grant access.

Step 12: You will receive an email once access is granted.

You are all set to start using our API.

## Authentication
The API is secured using API keys and you need to be authenticated to receive a key.

## Working with cURL
Curl is a command-line tool used to transfer data over various protocols such as HTTP, HTTPS, FTP, FTPS, SFTP, etc. Here is a beginner's guide to using the curl command line:

### Basic GET request:

To make a basic GET request, simply use the curl command followed by the URL:

`curl https://www.example.com` 

This will retrieve the HTML content of the webpage at https://www.example.com.

### Adding headers:

You can add headers to your request using the -H option followed by the header name and value:

`curl -H "Content-Type: application/json" https://api.example.com/data`

This will add the "Content-Type" header with a value of "application/json" to your request.

### Sending data:

You can send data with your request using the -d option followed by the data:

`curl -d '{"name": "John", "age": 30}' https://api.example.com/data`

This will send the JSON data {"name": "John", "age": 30} with your request.

### Authentication:

You can add authentication to your request using the -u option followed by your username and password:

`curl -u username:password https://api.example.com/data`

This will send your username and password with your request for authentication.

### Saving response:

You can save the response to a file using the -o option followed by the filename:

`curl -o output.html https://www.example.com`


This will save the HTML content of the webpage at `https://www.example.com` to the file "output.html".

### Basic POST request:

To send a POST request with CURL, you can use the following command:

`curl -X POST -H "Content-Type: application/json" -d '{"key1":"value1", "key2":"value2"}' http://example.com/api/endpoint`

Here's a breakdown of the command:

`curl`: the command to use CURL

`-X POST`: specifies that we want to use the HTTP POST method

`-H "Content-Type: application/json"`: sets the content type header to JSON

`-d '{"key1":"value1", "key2":"value2"}'`: specifies the data to send in the POST request, in this case a JSON object

`http://example.com/api/endpoint`: the URL of the API endpoint to which the request is being sent
You can modify the data and URL to match the specific requirements of the API you are using.

These are some of the basic features of curl. There are many more options and configurations available, so it's worth reading the documentation to learn more.

## Transaction API
### Send your first API request using cURL
### Endpoints

#### Submit Transaction
This endpoint enables ministries to submit transaction files for processing. The endpoint expects a POST request with the transaction file attached as a binary payload. The request should also include a header with the API key for authentication. The endpoint returns a 200 OK status code if the submission is successful. If there are errors in the transaction file, the endpoint returns a 400 Bad Request status code, along with a JSON response that details the errors.
#### Endpoint URL:
#### Example Request:
POST /api/
Host: paymentcomponent.gov.bc.ca
Authorization: API Key
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="transaction_file.txt"

#### Example Response (Success):
HTTP/1.1 200 OK

#### Example Response (Error):
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "errors": [
    {
      "code": "INVALID_AMOUNT",
      "message": "Invalid amount format"
    },
    {
      "code": "DUPLICATE_TRANSACTION",
      "message": "Duplicate transaction found"
    }
  ]
}
### Postman
In the Postman app, complete the following:

Set the verb to POST.
Enter https://api-m.sandbox.paypal.com/v1/oauth2/token as the request URL.
Select the Authorization tab.
From the TYPE list, select Basic Auth.
In the Username field, enter your client ID.
In the Password field, enter your secret.
Select the Body tab.
Select the x-www-form-urlencoded option.
In the KEY field, enter grant_type.
In the VALUE field, enter client_credentials.
Select Send.

### View logs and events
### Store your API keys
### Code Snippets

## Reconciliaiton Report API
### Endpoints
#### Get Reconciliation Report
This endpoint enables ministries to retrieve a daily report of the reconciliation results. The report includes details such as the number of transactions processed, the total amount processed, and any errors encountered during reconciliation. The report is generated automatically and sent to the ministry's designated email address. The endpoint does not require any parameters or headers.
#### Endpoint URL:
#### Example Request:
GET /api/daily-report HTTP/1.1
Host: paymentcomponent.gov.bc.ca

#### Example Response
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="daily_report.pdf"
