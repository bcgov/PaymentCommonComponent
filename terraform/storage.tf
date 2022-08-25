resource "aws_s3_bucket" "files" {
  bucket = "bcgov-pcc-files"
}

resource "aws_s3_bucket_acl" "files_acl" {
  bucket = aws_s3_bucket.files.id
  acl    = "private"
}