<!-- Generator: Widdershins v4.0.1 -->

<h1 id="paycoco-api-docs">PayCoCo API Docs v0.0.1</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Payment Common Component API Documentation

Base URLs:

# Authentication

- HTTP Authentication, scheme: basic 

<h1 id="paycoco-api-docs-health-api">Health API</h1>

## AppController_getVersion

<a id="opIdAppController_getVersion"></a>

> Code samples

`GET /api/v0/version`

<h3 id="appcontroller_getversion-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

## AppController_getError

<a id="opIdAppController_getError"></a>

> Code samples

`GET /api/v0/error`

<h3 id="appcontroller_geterror-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

## AppController_getHealth

<a id="opIdAppController_getHealth"></a>

> Code samples

`GET /api/v0/health`

<h3 id="appcontroller_gethealth-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

<h1 id="paycoco-api-docs-transaction-api">Transaction API</h1>

## TransactionController_saveTransactionEvent

<a id="opIdTransactionController_saveTransactionEvent"></a>

> Code samples

`POST /api/v0/transaction`

*Post Sales Event*

> Body parameter

```json
[
  {
    "transaction_id": "72cbe1da-b08e-49d4-9a87-69afd660d14b",
    "transaction_date": "2023-01-01",
    "transaction_time": "13.33.31.875973",
    "fiscal_close_date": "2023-01-02",
    "total_transaction_amount": 30.2,
    "void_indicator": false,
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
  }
]
```

<h3 id="transactioncontroller_savetransactionevent-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|any|true|none|

> Example responses

> default Response

```json
{
  "data": []
}
```

<h3 id="transactioncontroller_savetransactionevent-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|default|Default|Returns the parsed sales reconciliation data|Inline|

<h3 id="transactioncontroller_savetransactionevent-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

<h1 id="paycoco-api-docs-parser-api">Parser API</h1>

## ParseController_uploadFile

<a id="opIdParseController_uploadFile"></a>

> Code samples

`POST /api/v0/parse/flat-file`

> Body parameter

```yaml
program: SBC
fileType: TDI17
file: string

```

<h3 id="parsecontroller_uploadfile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» program|body|string|false|none|
|» fileType|body|string|false|none|
|» file|body|string(binary)|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» program|SBC|
|» program|LABOUR|
|» fileType|TDI17|
|» fileType|TDI34|

<h3 id="parsecontroller_uploadfile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

## ParseController_uploadAndParseFile

<a id="opIdParseController_uploadAndParseFile"></a>

> Code samples

`POST /api/v0/parse/upload-file`

> Body parameter

```yaml
fileName: string
fileType: TDI17
program: SBC
file: string

```

<h3 id="parsecontroller_uploadandparsefile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» fileName|body|string|false|none|
|» fileType|body|string|false|none|
|» program|body|string|false|none|
|» file|body|string(binary)|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|» fileType|TDI17|
|» fileType|TDI34|
|» fileType|SBC_SALES|
|» program|SBC|
|» program|LABOUR|

<h3 id="parsecontroller_uploadandparsefile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
basic
</aside>

# Schemas

