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

    resources = ["arn:aws:s3:::*"]
  }
}

resource "aws_glacier_vault" "pcc_archive" {
  name = "PccArchive"

  access_policy = data.aws_iam_policy_document.archive_read_only.json

  tags = {
    Name        = "pcc-s3-archive-${var.target_env}"
    Environment = var.target_env
  }
}