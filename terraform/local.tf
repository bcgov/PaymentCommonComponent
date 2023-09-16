
resource "aws_s3_bucket" "local_development" {
  count = var.target_env == "dev" ? 1 : 0
  bucket = "pcc-integration-data-files-local"

  logging {
    target_bucket = aws_s3_bucket.pcc-s3-access-logs.id
    target_prefix = "logs/pcc-integration-data-files-local/"
  }
}

resource "aws_s3_bucket_acl" "local_development_acl" {
  count = var.target_env == "dev" ? 1 : 0
  bucket = aws_s3_bucket.local_development[0].id
  acl    = "private"
}
