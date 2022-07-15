resource "aws_kinesis_stream" "sales" {
  name             = "sales"
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


resource "aws_kinesis_stream" "lob_one" {
  name             = "lob_one"
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

resource "aws_kinesis_stream" "lob_two" {
  name             = "lob_two"
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
