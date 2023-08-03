
# This is the IAM policy that the service account used in CI is going to carry. 

data "aws_iam_policy_document" "service_account" {
  statement {
    sid    = "AllowS3FullAccess"
    effect = "Allow"
    actions = [
      "s3:PutObjectAcl",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:GetObject",
      "s3:GetBucketLocation",
      "s3:DeleteObject"
    ]
  resources = [
      "arn:aws:s3:::*",
    ]
  }

  statement {
    sid    = "AllowLambdaInvokeDeploy"
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction",
      "lambda:UpdateFunctionCode",
    ]
    resources = [
      "arn:aws:lambda:${var.region}:${var.target_aws_account_id}:function:*",
    ]
  }

  statement {
    sid    = "AllowDBClusterSnapshot"
    effect = "Allow"
    actions = [
      "rds:AddTagsToResource",
      "rds:CreateDBClusterSnapshot",
    ]
    resources = [
      "arn:aws:lambda:${var.region}:${var.target_aws_account_id}:cluster:*",
    ]
  }
}

# Uncomment when output iam is required - Less noisy this way

output "service_account_iam" {
  value = data.aws_iam_policy_document.service_account.json
}


