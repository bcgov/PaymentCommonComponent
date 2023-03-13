
resource "aws_s3_bucket" "pcc-reporting" {
  bucket = "pcc-recon-reports-${var.target_env}"
  tags = {
    Name        = "pcc-recon-reports-${var.target_env}"
    Environment = var.target_env
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

