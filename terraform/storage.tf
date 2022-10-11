resource "aws_s3_bucket" "files" {
  bucket = "bcgov-pcc-files-${var.target_env}"
}

resource "aws_s3_bucket_acl" "files_acl" {
  bucket = aws_s3_bucket.files.id
  acl    = "private"
}


resource "aws_s3_bucket" "packages" {
  bucket = "${var.lz2_code}-${var.target_env}-packages"
}

resource "aws_s3_bucket_acl" "packages_acl" {
  bucket = aws_s3_bucket.packages.id
  acl    = "private"
}
