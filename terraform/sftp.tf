resource "aws_transfer_server" "sftp" {
  domain                           = "S3"
  protocols                        = ["SFTP"]
  endpoint_type                    = "PUBLIC"
  identity_provider_type           = "SERVICE_MANAGED"
  security_policy_name             = "TransferSecurityPolicy-2022-03"
  post_authentication_login_banner = "Logged into ~~~~ ENV: ${var.target_env} ~~~~~ Payment Common Components SFTP"
  tags = {
    Name = "sftp"
  }
}

resource "aws_iam_role" "sftp_user" {
  name               = "transfer-user-iam-role"
  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Principal": {
            "Service": "transfer.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy" "sftp_user" {
  name = "transfer-user-iam-policy"
  role = aws_iam_role.sftp_user.id

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowListingOfUserFolder",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Effect": "Allow",
            "Resource": [ "${aws_s3_bucket.sftp_storage.arn}" ]
        },
        {
            "Sid": "HomeDirObjectAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObjectVersion",
                "s3:DeleteObject",
                "s3:GetObjectVersion"
            ],
            "Resource": ["${aws_s3_bucket.sftp_storage.arn}/*"] 
        }
    ]
}
POLICY
}

resource "aws_s3_bucket" "sftp_storage" {
  bucket = "pcc-integration-data-files-${var.target_env}"

  logging {
    target_bucket = aws_s3_bucket.pcc-s3-access-logs.id
    target_prefix = "logs/pcc-integration-data-files-${var.target_env}/"
  }
}

resource "aws_s3_bucket_policy" "allow_prod_to_access_other_envs" {
  bucket = aws_s3_bucket.sftp_storage.id
  policy = data.aws_iam_policy_document.allow_prod_to_access_other_envs.json
}

data "aws_iam_policy_document" "allow_prod_to_access_other_envs" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["953134788580"] # Allow prod to access dev and test buckets
    }

    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObjectAcl",
      "s3:PutObject",
      "s3:GetBucketLocation",
      "s3:DeleteObject"
    ]

    resources = [
      aws_s3_bucket.sftp_storage.arn,
      "${aws_s3_bucket.sftp_storage.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_acl" "sftp_storage_acl" {
  bucket = aws_s3_bucket.sftp_storage.id
  acl    = "private"
}

resource "aws_transfer_user" "sbc" {
  server_id           = aws_transfer_server.sftp.id
  user_name           = "sbc"
  role                = aws_iam_role.sftp_user.arn
  home_directory_type = "LOGICAL"

  home_directory_mappings {
    entry  = "/"
    target = "/${aws_s3_bucket.sftp_storage.id}/sbc"
  }
}

resource "aws_transfer_ssh_key" "sbc" {
  server_id = aws_transfer_server.sftp.id
  user_name = aws_transfer_user.sbc.user_name
  body      = data.aws_ssm_parameter.sftp_user_sbc.value
}

resource "aws_transfer_user" "pcc" {
  server_id           = aws_transfer_server.sftp.id
  user_name           = "pcc"
  role                = aws_iam_role.sftp_user.arn
  home_directory_type = "LOGICAL"
  home_directory_mappings {
    entry  = "/"
    target = "/${aws_s3_bucket.sftp_storage.id}/sbc"
  }
}

resource "aws_transfer_ssh_key" "pcc" {
  server_id = aws_transfer_server.sftp.id
  user_name = aws_transfer_user.pcc.user_name
  body      = data.aws_ssm_parameter.sftp_user_pcc.value
}

resource "aws_transfer_user" "bcm" {
  server_id           = aws_transfer_server.sftp.id
  user_name           = "bcm"
  role                = aws_iam_role.sftp_user.arn
  home_directory_type = "LOGICAL"
  home_directory_mappings {
    entry  = "/"
    target = "/${aws_s3_bucket.sftp_storage.id}/bcm"
  }
}

resource "aws_transfer_ssh_key" "bcm" {
  server_id = aws_transfer_server.sftp.id
  user_name = aws_transfer_user.bcm.user_name
  body      = data.aws_ssm_parameter.sftp_user_bcm.value
}


output "sftp_url" {
  value = aws_transfer_server.sftp.endpoint
}
