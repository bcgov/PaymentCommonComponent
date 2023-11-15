locals {
  vault_name = "PccArchive"
}

data "aws_iam_policy_document" "archive_read_only" {
  statement {
    sid    = "add-read-only-perm"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "glacier:InitiateJob",
      "glacier:GetJobOutput",
    ]

    resources = [
      "arn:aws:glacier:${var.region}:${var.target_aws_account_id}:vaults/${local.vault_name}"
    ]
  }
}

resource "aws_glacier_vault" "pcc_archive" {
  name = local.vault_name

  access_policy = data.aws_iam_policy_document.archive_read_only.json

  tags = {
    Name        = "pcc-s3-archive-${var.target_env}"
    Environment = var.target_env
  }
}