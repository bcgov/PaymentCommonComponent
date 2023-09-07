locals {
  pcc-reporting-bucket-name = "pcc-recon-reports-${var.target_env}"
  pcc-master-data-bucket-name = "pcc-master-data-${var.target_env}"
  pcc-deployments-bucket-name = "pcc-deployments-${var.target_env}"
}


resource "aws_s3_bucket" "pcc-reporting" {
  bucket = local.pcc-reporting-bucket-name
  tags = {
    Name        = local.pcc-reporting-bucket-name
    Environment = var.target_env
  }

  logging {
    target_bucket = aws_s3_bucket.pcc-s3-access-logs.id
    target_prefix = "logs/${local.pcc-reporting-bucket-name}/"
  }
}

resource "aws_s3_bucket_versioning" "pcc-reporting" {
  bucket = aws_s3_bucket.pcc-reporting.id
  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pcc-reporting" {
  bucket = aws_s3_bucket.pcc-reporting.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_acl" "pcc-reporting" {
  bucket = aws_s3_bucket.pcc-reporting.id
  acl    = "private"
}

resource "aws_s3_bucket_public_access_block" "pcc-reporting" {
  bucket                  = aws_s3_bucket.pcc-reporting.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "pcc-reporting" {
  bucket = aws_s3_bucket.pcc-reporting.id
  policy = data.aws_iam_policy_document.pcc-reporting.json
}

data "aws_iam_policy_document" "pcc-reporting" {
  statement {
    sid    = "EnforceSecureTransport"
    effect = "Deny"
    principals {
      identifiers = ["*"]
      type        = "*"
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.pcc-reporting.arn,
      "${aws_s3_bucket.pcc-reporting.arn}/*"
    ]
    condition {
      test     = "Bool"
      values   = ["false"]
      variable = "aws:SecureTransport"
    }
  }
}

resource "aws_s3_bucket" "pcc-master-data" {
  bucket = local.pcc-master-data-bucket-name
  tags = {
    Name        = local.pcc-master-data-bucket-name
    Environment = var.target_env
  }

  logging {
    target_bucket = aws_s3_bucket.pcc-s3-access-logs.id
    target_prefix = "logs/${local.pcc-master-data-bucket-name}/"
  }
}


resource "aws_s3_bucket_ownership_controls" "pcc_master_data_ownership" {
  bucket = aws_s3_bucket.pcc-master-data.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "pcc_master_data_pb" {
  bucket = aws_s3_bucket.pcc-master-data.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "pcc_master_data_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.pcc_master_data_ownership]
  bucket = aws_s3_bucket.pcc-master-data.id
  acl    = "private"
}


resource "aws_s3_bucket" "pcc-deployments" {
  bucket = local.pcc-deployments-bucket-name
  tags = {
    Name        = local.pcc-deployments-bucket-name
    Environment = var.target_env
  }
  logging {
    target_bucket = aws_s3_bucket.pcc-s3-access-logs.id
    target_prefix = "logs/${local.pcc-deployments-bucket-name}/"
  }
}

resource "aws_s3_bucket_versioning" "pcc-deployments" {
  bucket = aws_s3_bucket.pcc-deployments.id
  versioning_configuration {
    status = "Disabled"
  }
}

// S3 bucket for storing S3 access logs
resource "aws_s3_bucket" "pcc-s3-access-logs" {
  bucket = "pcc-s3-access-logs-${var.target_env}"
  tags = {
    Name        = "pcc-s3-access-logs-${var.target_env}"
    Environment = var.target_env
  }
}


resource "aws_s3_bucket_ownership_controls" "pcc-s3-access-logs-ownership" {
  bucket = aws_s3_bucket.pcc-s3-access-logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "pcc-s3-access-logs-acl" {
  depends_on = [aws_s3_bucket_ownership_controls.pcc-s3-access-logs-ownership]
  bucket = aws_s3_bucket.pcc-s3-access-logs.id
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket_versioning" "pcc-s3-access-logs" {
  bucket = aws_s3_bucket.pcc-s3-access-logs.id
  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pcc-s3-access-logs" {
  bucket = aws_s3_bucket.pcc-s3-access-logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

