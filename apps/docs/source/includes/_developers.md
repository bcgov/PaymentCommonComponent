# Developers

## Pre-requisites

1. Have you communicated with your finance responsible and is s/he onboard with this?
2. Information about your GL coding is required.

## Explore our APIs
Common Component for Payments' APIs power its platform to perform automated reconciliation of payments across the various lines of businesses across British Columbia. Behind these APIs is a software layer connecting and optimizing communications networks to allow your users to simplify and streamline the payment processes and technology across the BC government payment ecosystem.

## Before you begin
You must have one of the following accounts for login to the API Services Portal: GitHub, IDIR or BC Services Card.

## Initial setup
Step 1: Navigate to the <a href=" https://api.gov.bc.ca"title="API Services">API Services Portal</a>

Step 2: Click on "For Developers".

![For Developers](../images/step2.png?raw=true "For Developers")

Step 3: Scroll down and click on the "Payment" API directory.

![Payment](../images/step3.png?raw=true "Payment")

Step 4: Click on "Request Access".

![Request Access](../images/step4.png?raw=true "Request Access")

Step 5: Click on "Login with IDIR". 

![Login](../images/step5.png?raw=true "Login")

Step 6: Enter your credentials and click "Continue".

Step 7: Click on "Create Application" and enter a name in the field titled "Application Name". Click on "Create".

![Create Application](../images/step8.png?raw=true "Create Application")

Step 8: Select the desired API environment and click on "Request Access".

Step 9: Click on "Request Access" again.

![Request Again](../images/step9.png?raw=true "Request Again")

Step 10: Click on "Click for Credentials".

Step 11: Save your secret credentials (client id, secret, and token) in a safe place; otherwise they will be lost once the screen disappears. Do not get the credentials checked into a public GitHub repository. If credentials are lost, you can regenerate a new secret from the API Services Portal.

Step 12: Wait for your API Service Provider to grant access.

Step 13: You will receive an email once access is granted.

You are all set to start using our API.

## Authentication
The API is secured using API keys and you need to be authenticated to receive a key.

## Transaction API

### View our Transaction API spec
View our sample <a href="https://ee1uqiu7x1.execute-api.ca-central-1.amazonaws.com/api#/Transaction%20API/TransactionController_saveTransactionEvent">API spec.</a>

### Send your first API request using cURL
### Endpoints

#### Submit Transaction
This endpoint enables ministries to submit transaction files for processing. The endpoint expects a POST request with the transaction file attached as a binary payload. The request should also include a header with the API key for authentication. The endpoint returns a 200 OK status code if the submission is successful. If there are errors in the transaction file, the endpoint returns a 400 Bad Request status code, along with a JSON response that details the errors.
#### Endpoint URL:
/api/v1/transaction
#### Example Request:
POST /api//v1/transaction

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
### Send your first API request using Postman
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
```python
url = "/api/v1/transaction"

payload = json.dumps({
  "transaction_id": "72cbe1da-b08e-49d4-9a87-69afd660d14b",
  "transaction_date": "2023-01-01",
  "transaction_time": "13.33.31.875973",
  "fiscal_close_date": "2023-01-02",
  "total_transaction_amount": 30.2,
  "void_indicator": False,
  "miscellaneous": {
    "employee_id": "SC61350"
  },
  "source": {
    "source_id": "SBC",
    "location_id": 61,
    "accepted_payment_methods": [
      "CASH",
      "CHQ",
      "P",
      "M",
      "V"
    ]
  },
  "payments": [
    {
      "amount": 20,
      "foreign_currency_amount": 15,
      "currency": "USD",
      "exchange_rate": 1.34,
      "payment_method": "CASH",
      "payment_channel": "in-person"
    },
    {
      "amount": 10.2,
      "currency": "CAD",
      "payment_method": "V",
      "payment_channel": "in-person",
      "terminal": {
        "card_no": "5253",
        "merchant_id": "20777441",
        "device_id": "GA2077744108",
        "invoice_no": ""
      },
      "online": {
        "tran_id": "",
        "order_no": ""
      },
      "pos": {
        "approval_code": "ASWQD24342"
      }
    }
  ],
  "accounting": [
    {
      "sequence": "001",
      "details": {
        "code": "1234",
        "description": "passport photocopy"
      },
      "distributions": [
        {
          "line_number": "00001",
          "line_description": "passport photocopy",
          "line_dollar_amount": 10,
          "disbursment_gl_account": {
            "dist_client_code": "074",
            "dist_resp_code": "66020",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1278",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000",
            "EFT": {
              "vendor": "xxx"
            }
          },
          "revenue_gl_account": {
            "dist_client_code": "074",
            "dist_resp_code": "66020",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1474",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          }
        },
        {
          "line_number": "00002",
          "line_description": "PST G/L            ",
          "line_dollar_amount": 0.7,
          "disbursment_gl_account": {
            "dist_client_code": "022",
            "dist_resp_code": "12345",
            "dist_service_line_code": "66123",
            "dist_stob_code": "4123",
            "dist_project_code": "3200000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          },
          "revenue_gl_account": {
            "dist_client_code": "074",
            "dist_resp_code": "66020",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1474",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          }
        },
        {
          "line_number": "00003",
          "line_dollar_amount": 0.5,
          "line_description": "GST G/L            ",
          "disbursment_gl_account": {
            "dist_client_code": "022",
            "dist_resp_code": "4567",
            "dist_service_line_code": "88123",
            "dist_stob_code": "4123",
            "dist_project_code": "3200000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          },
          "revenue_gl_account": {
            "dist_client_code": "074",
            "dist_resp_code": "66020",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1474",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          }
        }
      ]
    },
    {
      "sequence": "002",
      "details": {
        "code": "1234",
        "description": "driving lic renewal"
      },
      "distributions": [
        {
          "line_number": "00001",
          "line_description": "driving lic renewal",
          "line_dollar_amount": 14,
          "disbursment_gl_account": {
            "dist_client_code": "010",
            "dist_resp_code": "66213",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1278",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000",
            "EFT": {
              "vendor": "xxx"
            }
          },
          "revenue_gl_account": {
            "dist_client_code": "074",
            "dist_resp_code": "66020",
            "dist_service_line_code": "44275",
            "dist_stob_code": "1474",
            "dist_project_code": "6600000",
            "dist_location_code": "000000",
            "dist_future_code": "0000",
            "supplier_code": "000000"
          }
        }
      ]
    }
  ]
})
headers = {
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
```

## Reconciliaiton Report API
### Endpoints
#### Endpoint URL: 
/api/v1/transaction

#### Example Request:
POST /api/v1/transaction
Host: paymentcomponent.gov.bc.ca

#### Example Response
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
