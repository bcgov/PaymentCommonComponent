# Introduction

## Overview
This document provides guidance for onboarding to the Common Component for Payments' APIs.

![pay](../images/pa7.jpeg?raw=true "Pay")
 
### What is the Common Component for Payments?

The Common Component for Payments is an API-driven system designed to streamline and automate the repetitive and manual tasks that ministries face when receiving and sending payments. The system aims to enhance the quality of data and traceability of payment transactions, while reducing the possibility of errors when re-entering data between systems.

The initial use cases for this project have been provided by Service BC to support the modernization of the Government Agent Revenue Management System (GARMS), as well as the Ministry of Labour’s Employment Standards Branch. The project team has also engaged broadly with stakeholders across government to identify opportunities for incremental improvement within government’s existing payments ecosystem.

### Why use the Common Component for Payments?
The Common Component for Payments is being implemented to address several gaps in the current payment ecosystem in British Columbia. By providing automated reconciliation and reporting of payments, the system aims to simplify the payment processes and technology across the BC government payment ecosystem. Here are some key reasons why the Common Component for Payments is being used:

Simplification: The Common Component for Payments is designed to simplify payment processes and technology across the BC government payment ecosystem. This means that users will not need to become financial experts to use the financial systems.

Automated Reconciliation: The system includes automated reconciliation of payments for a variety of payment methods: credit card, cheque, cash, in-person point of sale, online payments, payments over the phone, wire transfers, Electronic Fund Transfers. This helps to reduce manual efforts and save time for ministries across British Columbia.

Consistency: The Common Component for Payments ensures consistency in the reconciliation processes across Lines of Business (LOBs) and eliminates inconsistencies that arise due to different systems being used by different LOBs.

Integration: The system integrates financial components such as the Provincial Treasury and CAS, which helps to streamline payment processes and ensure that all financial data is accurate and up to date.

Error Handling: The system provides error handling where possible, which helps to minimize errors and ensure that payments are processed accurately.

Overall, the Common Component for Payments provides a more streamlined, consistent, and efficient payment ecosystem for the BC government.

### How does the Common Component for Payments work?
The Common Component for Payments works by receiving transaction files from ministry line of businesses through an API endpoint. These transaction files are then ingested and parsed into JSON format and loaded into the system's database. Bank files from the Provincial Treasury are also ingested and parsed into the system.

Once the files are loaded into the database, the system's reconciliation engine compares the transaction files against the bank files received from the Provincial Treasury. 

The Common Component for Payments is designed to handle a wide range of payment types and sources across the BC government payment ecosystem, including in-person cash, cheque, and point of sale transactions.

For Service BC, the transaction file includes line details for these types of transactions. The system then receives two Treasury files, TDI 17 and TDI 34, which contain information on the total sum of cash and cheques for each office location and line detail point of sale transactions for each office location, respectively.

The system then uses its reconciliation engine to reconcile the transaction file against the Treasury files. Specifically, the system sums up the cash and cheques in the transaction file and reconciles them with the total sum of cash and cheques in TDI 17. The system also reconciles the line detail point of sale transactions in the transaction file with the line detail point of sale transactions in TDI 34. The reconciliation engine performs a match and kill function to automatically reconcile the transactions and detect any discrepancies. Unmatched entries are flagged as exceptions, which are further investigated and resolved by the line of business finance staff.


## Audience
This documentation is designed for developers and product owners.

## Project GitHub Repository
We are hosting on Amazon Web Services (AWS) for BC Government.
View the
<a href="https://github.com/bcgov/PaymentCommonComponent" title="Common Component">Common Component Project repo</a> to explore the Common Component codebase.


## Diagrams

![Automated Reconciliation Diagram](../images/recon.png?raw=true "Reconciliation Diagram")
