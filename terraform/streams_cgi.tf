

# From CGI - CAS (Corporate Accounting System) Gateway Interface

resource "aws_kinesis_stream" "journal_vouchers_cgi" {
  name             = "journal_vouchers_cgi"
  shard_count      = 1
  retention_period = 48

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes",
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  encryption_type = "NONE" # Production

  tags = {
    Environment = local.namespace
  }
}

resource "aws_kinesis_stream" "general_ledger_aggregates_cgi" {
  name             = "general_ledger_aggregates_cgi"
  shard_count      = 1
  retention_period = 48

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes",
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  encryption_type = "NONE" # Production

  tags = {
    Environment = local.namespace
  }
}
