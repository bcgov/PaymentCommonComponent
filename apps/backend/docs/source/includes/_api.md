<!-- Generator: Widdershins v4.0.1 -->

<h1 id="paycoco-api-docs">PayCoCo API Docs v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Payment Common Component API Documentation

Base URLs:

<h1 id="paycoco-api-docs-sales-api">Sales API</h1>

## SalesController_saveSalesEvent

<a id="opIdSalesController_saveSalesEvent"></a>

> Code samples

`POST /api/v1/sale`

*Post Sales Event*

> Body parameter

```json
{
  "id": "264595a1-4775-4bfe-9b3a-358bbbb5c4f7",
  "sale_date": "2022-10-25",
  "journal_name": "SM J000001",
  "ministry_alpha_identifier": "SM",
  "total_amount": 150.5,
  "payment_method": [
    {
      "amount": 100,
      "method": "CASH"
    },
    {
      "amount": 50.5,
      "method": "POS_CREDIT"
    }
  ],
  "distributions": [
    {
      "line_number": "00001",
      "dist_client_code": "130",
      "dist_resp_code": "29KGT",
      "dist_service_line_code": "38513",
      "dist_stob_code": "4303",
      "dist_project_code": "29K0230",
      "dist_location_code": "000000",
      "dist_future_code": "0000",
      "line_amount": 150.5,
      "line_code": "C",
      "line_description": "GA OFF# 00002 2022-08-05                    *900100002",
      "gl_date": "2022-10-12",
      "supplier_code": "xxxxxx"
    },
    {
      "line_number": "00002",
      "dist_client_code": "074",
      "dist_resp_code": "32L14",
      "dist_service_line_code": "58200",
      "dist_stob_code": "1461",
      "dist_project_code": "3200000",
      "dist_location_code": "000000",
      "dist_future_code": "0000",
      "line_amount": 150.5,
      "line_code": "D",
      "line_description": "GA OFF# 00014 2022-08-05",
      "gl_date": "2022-10-12",
      "supplier_code": "xxxxxx"
    }
  ]
}
```

<h3 id="salescontroller_savesalesevent-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[SalesDTO](#schemasalesdto)|true|none|

> Example responses

> 201 Response

```json
{
  "data": {}
}
```

<h3 id="salescontroller_savesalesevent-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|[EmptyResponse](#schemaemptyresponse)|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_PaymentMethodDTO">PaymentMethodDTO</h2>
<!-- backwards compatibility -->
<a id="schemapaymentmethoddto"></a>
<a id="schema_PaymentMethodDTO"></a>
<a id="tocSpaymentmethoddto"></a>
<a id="tocspaymentmethoddto"></a>

```json
{
  "amount": 100.5,
  "method": "CASH"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|amount|number|true|none|Amount paid|
|method|string|true|none|Method Of Payment|

#### Enumerated Values

|Property|Value|
|---|---|
|method|CASH|
|method|CHQ|
|method|POS_CREDIT|
|method|POS_DEBIT|
|method|ONL_CREDIT|
|method|ONL_DEBIT|

<h2 id="tocS_DistributionDTO">DistributionDTO</h2>
<!-- backwards compatibility -->
<a id="schemadistributiondto"></a>
<a id="schema_DistributionDTO"></a>
<a id="tocSdistributiondto"></a>
<a id="tocsdistributiondto"></a>

```json
{
  "line_number": "00001",
  "dist_client_code": "130",
  "dist_resp_code": "29KGT",
  "dist_service_line_code": "38513",
  "dist_stob_code": "4303",
  "dist_project_code": "29KGT",
  "dist_location_code": "000000",
  "dist_future_code": "0000",
  "line_amount": 50,
  "line_code": 50,
  "line_description": "lorem ipsum dolor sit amet",
  "gl_date": "2019-08-24T14:15:22Z",
  "supplier_code": "lorem ipsum dolor sit amet"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|line_number|string|true|none|Sequential 6 digit line numbers|
|dist_client_code|string|true|none|3 character Client Number - the legal entity (Ministry, Trust, Special Account, Special Fund) and the balancing segment in the General Ledger.|
|dist_resp_code|string|true|none|5 Character Responsibility Centre - identifies how the ministry has assigned responsibility and accountability to manage human, financial and capital resources.|
|dist_service_line_code|string|true|none|5 Character Service Line Code -  identifies the ministry program or service at the lowest functional level desired.|
|dist_stob_code|string|true|none|4 Character STOB (Standard Object of Expenditure) -  identifies the nature of goods and services purchased (office supplies, salaries) and the nature of payment (government transfers). Also used to classify transactions according to common characteristics such as expenses, revenue, assets, liabilities and equity.|
|dist_project_code|string|true|none|7 Character Project Code - identifies projects or additional activity detail as defined by ministries or agencies|
|dist_location_code|string|true|none|6 Character Location Code - (not yet implemented) defines where (the location) the benefit was received as a result of the transaction.|
|dist_future_code|string|true|none|5 Character Future Code -  (not yet implemented) segment reserved for future business.|
|line_amount|number|true|none|Distribution amount to the CoA|
|line_code|string|true|none|Credit or Debit Indicator|
|line_description|string|true|none|Free text description of the distribution|
|gl_date|string(date-time)|true|none|none|
|supplier_code|string|true|none|Free text description of the distribution|

<h2 id="tocS_SalesDTO">SalesDTO</h2>
<!-- backwards compatibility -->
<a id="schemasalesdto"></a>
<a id="schema_SalesDTO"></a>
<a id="tocSsalesdto"></a>
<a id="tocssalesdto"></a>

```json
{
  "id": "264595a1-4775-4bfe-9b3a-358bbbb5c4f7",
  "sale_date": "2022-10-25",
  "journal_name": "SM J000001",
  "ministry_alpha_identifier": "SM",
  "total_amount": 150.5,
  "payment_method": [
    {
      "amount": 100,
      "method": "CASH"
    },
    {
      "amount": 50.5,
      "method": "POS_CREDIT"
    }
  ],
  "distributions": [
    {
      "line_number": "00001",
      "dist_client_code": "130",
      "dist_resp_code": "29KGT",
      "dist_service_line_code": "38513",
      "dist_stob_code": "4303",
      "dist_project_code": "29K0230",
      "dist_location_code": "000000",
      "dist_future_code": "0000",
      "line_amount": 150.5,
      "line_code": "C",
      "line_description": "GA OFF# 00002 2022-08-05                    *900100002",
      "gl_date": "2022-10-12",
      "supplier_code": "xxxxxx"
    },
    {
      "line_number": "00002",
      "dist_client_code": "074",
      "dist_resp_code": "32L14",
      "dist_service_line_code": "58200",
      "dist_stob_code": "1461",
      "dist_project_code": "3200000",
      "dist_location_code": "000000",
      "dist_future_code": "0000",
      "line_amount": 150.5,
      "line_code": "D",
      "line_description": "GA OFF# 00014 2022-08-05",
      "gl_date": "2022-10-12",
      "supplier_code": "xxxxxx"
    }
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|Id|
|sale_date|string|true|none|Sales Txn Date|
|journal_name|string|true|none|Journal Name - Prefixed with 2 character Ministry Alpha identifier|
|ministry_alpha_identifier|string|true|none|Ministry Alpha Identifier|
|total_amount|number|true|none|Total Value of the Txn|
|payment_method|[PaymentMethodDTO](#schemapaymentmethoddto)|true|none|Payment of total amount by method|
|distributions|[DistributionDTO](#schemadistributiondto)|true|none|Distribution of funds to other ministries and program areas by GL codes|

<h2 id="tocS_EmptyResponse">EmptyResponse</h2>
<!-- backwards compatibility -->
<a id="schemaemptyresponse"></a>
<a id="schema_EmptyResponse"></a>
<a id="tocSemptyresponse"></a>
<a id="tocsemptyresponse"></a>

```json
{
  "data": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|data|object|true|none|This Response returns an acknowledgmenent<br>      that the request has been fulfilled.|

