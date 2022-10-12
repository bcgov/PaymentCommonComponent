resource "aws_s3_bucket" "bc_pcc_files_bucket" {
  bucket = "bc-pcc-data-files-${var.target_env}"
}

resource "aws_s3_bucket_acl" "bc-pcc-files-bucket-acl" {
  bucket = aws_s3_bucket.bc_pcc_files_bucket.id
  acl    = "private"
}
resource "aws_s3_bucket" "packages" {
  bucket = "${var.lz2_code}-${var.target_env}-packages"
}

resource "aws_s3_bucket_acl" "packages_acl" {
  bucket = aws_s3_bucket.packages.id
  acl    = "private"
}
