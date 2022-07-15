

# From TDI - Treasury Deposit Information
resource "aws_kinesis_stream" "credit_card_settlement" {
  name             = "credit_card_settlement"
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