resource "aws_kinesis_firehose_delivery_stream" "sales_events_to_s3_delivery_stream" {
  name        = "SalesDelivery"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_role.arn
    bucket_arn = aws_s3_bucket.bc_pcc_files_bucket.arn

    buffer_size     = 1
    buffer_interval = 60

    compression_format  = "UNCOMPRESSED"
    error_output_prefix = "SALES_ERR"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.pcc_firehose_delivery.name
      log_stream_name = aws_cloudwatch_log_stream.sales_firehose_delivery.name
    }
  }
}

resource "aws_cloudwatch_log_group" "pcc_firehose_delivery" {
  name = "pcc_firehose_delivery"
  retention_in_days = 731
  tags = {
    Environment = "${var.target_env}"
  }
}

resource "aws_cloudwatch_log_stream" "sales_firehose_delivery" {
  name           = "sales_firehose_delivery"
  log_group_name = aws_cloudwatch_log_group.pcc_firehose_delivery.name
}

resource "aws_iam_role" "firehose_role" {
  name = "firehose_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "firehose.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "firehose_delivery_access" {
  role       = aws_iam_role.firehose_role.name
  policy_arn = aws_iam_policy.firehose_delivery_access.arn
}
resource "aws_iam_policy" "firehose_delivery_access" {
  name   = "${var.target_env}_pcc_firehose"
  policy = data.aws_iam_policy_document.firehose_delivery.json
}

data "aws_iam_policy_document" "firehose_delivery" {
  statement {
    sid    = "allowS3Access"
    effect = "Allow"
    actions = [
      "s3:AbortMultipartUpload",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:PutObject"
    ]

    resources = [
      aws_s3_bucket.bc_pcc_files_bucket.arn,
      "${aws_s3_bucket.bc_pcc_files_bucket.arn}/*",
    ]
  }
}
