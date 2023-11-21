Archiving: what and why?

Archiving will mean determining a timeframe where artifacts we store are “current”. After such a timeframe, things are then archived. Archiving will help with organization, costs (in the longer term), and possibly performance of the application. There are three things in discussion for archiving: files, data, and reports.

With Files, archiving after a certain timeframe will help keep costs manageable in S3 so that we’re not storing too much data at once. With one customer, this is a pretty inexpensive solution, but as the userbase grows, so too will the number of daily files being processed. As such, we will want a lower cost, cold storage solution that will allow us to retrieve backups from the past, even if it’s not necessarily instant. Removing files from the main S3 bucket will also help with running the app locally more quickly, as we pull less data when syncing from S3 (which is the current ‘test’ data we use). That issue would be mitigated by producing actual test data.

With data, archiving after a certain timeframe could help keep the database manageable. There should not be a lot of performance impacts as a result of archival. On top of that, there will be a decision tradeoff, depending on how far back data / reports will need to be accessed, and how we will be storing reports.

Reports are stored in S3, and archival decisions depend solely on how far back we feel customers will want to have access to reports instantaneously. We will likely want to archive reports in the same vein as the files (cold storage), to avoid S3 from ballooning. If we choose not to archive from the database, this means we can allow users to generate reports from any point in time. However, if we do choose to archive from the database, we will need to know if we can rely on reports in storage because otherwise we would have to restore data to generate reports, which seems excessive.

Recommendation: Files should be archived. Data from the database should not, for the moment. Reports should be archived, but can also be generated for any point in time from data in our database.

How long do we hold onto files in S3 for?

We’ll want to hold on to data files for a reasonable amount for audit and troubleshooting purposes, so that if any questions come up for past reports, we are able to find and restore data quite easily, even locally. Being able to follow how a line item was reconciled (or not) is a factor in the decision making for archival.

In discussions with Aiden, we feel its relatively safe to hold on to files for one year, and data won’t typically be requested for instant access past that. This should be safe enough to avoid impact of missing files as well. Reports could be given a much short lifespan given that they’re infrequently needed months after the fact. The current recommendation here is 3 months.

Recommendation: Files and reports should sit in our S3 for a year, and we can set them for archival after that.

Where do we archive files no longer needed in S3? How can we restore them if needed?

There are possibilities for gov solutions that are possibly on-prem, but Aiden has felt that this is not drastically cheaper, and the complexity between switching services may not be worth it. Given this line of thinking, it makes the most sense to stick to AWS and S3 unless another service provides an undeniable advantage. As of this moment, there do not appear to be options that provide a massive advantage. As an example, Azure seems to provide cold storage that is slightly cheaper than S3’s, but archival and possibly retrieval between services may not be worth the complexity or the paperwork.

S3 provides different tiers depending on how often and how fast retrieval needs to happen. We can make an assumption that archived files past a year will be infrequently accessed, and access will not need to be instantaneously retrieved

Here’s the list of storage options on S3: Amazon S3 Simple Storage Service Pricing - Amazon Web Services 

Recommendation: Our two best options are between S3 Glacier Flexible Retrieval and S3 Glacier Deep Archive (the two cheapest options). Deep Archive has lower costs of storage, with slightly higher costs of retrieval and inability to pull files in minutes. Given the use cases of storage, where files would likely only be pulled for auditing purposes, I believe Deep Archive would be the best and most cost effective option. Choosing flexible retrieval would be the conservative decision though, if we want to play it safe.

How long do we hold onto data in the DB?

Recommendation: As above, the current recommendation is that we keep data in the db until it is either nonperformant for any reason or we see a business requirement to archive.

How do we archive DB data, if no longer needed? What is the impact to reporting of archiving data from the DB?

Recommendation: We will not do this for now because it would impact retrieving reports from past dates. If we find there’s a need to archive DB data AND that reports will seldomly need to be pulled after a year, we can determine the next steps of action.

Do we retain any historical reports?

Recommendation: Up to a year’s worth, since we will have them accessible in S3 regardless. Past that, we can generate reports for data in the past.

We will want to do some discovery on how reports will be used. Are they necessary daily? Are they more often accessed monthly, and as such we will only need to retain end-of-month or beginning-of-month reports?

What does the user see if they try to generate a report for older dates?

Recommendation: For any dates we do not have in our database, we will want to throw an error for the user.


