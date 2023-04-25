#### TDI17 Parsing

See the [TDI17_Layout](tdi17_layout.txt) details section for field parsing breakdown

_note_: Negative values in the TDI17 are indiciated by the 13th character after the 12 character string for: "deposit_amt_curr", "deposit_amt_cdn" and "exchange_adjusted_amt". This 13th character negative indicator is used in parsing the TDI17 to transform the 12 character value for these fields into a negative amount. The 13th character "negative indicator" is not stored in the DB and is only used during parsing.
