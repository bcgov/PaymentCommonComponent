resource "aws_lambda_function" "parser" {
  description                    = "Parser function ${local.namespace}"
  function_name                  = "parser"
  role                           = aws_iam_role.lambda.arn
  runtime                        = "nodejs18.x"
  filename                       = "build/empty_lambda.zip"
  source_code_hash               = filebase64sha256("build/empty_lambda.zip")
  handler                        = "src/lambdas/parser.handler"
  memory_size                    = 1024
  timeout                        = 600
  reserved_concurrent_executions = 1

  vpc_config {
    security_group_ids = [data.aws_security_group.app.id]
    subnet_ids         = data.aws_subnets.app.ids
  }

  environment {
    variables = {
      NODE_ENV                      = "production"
      RUNTIME_ENV                   = var.target_env
      DB_USER                       = var.db_username
      DB_PASSWORD                   = data.aws_ssm_parameter.postgres_password.value
      DB_HOST                       = aws_rds_cluster.pgsql.endpoint
      DB_NAME                       = aws_rds_cluster.pgsql.database_name
      API_URL                       = aws_apigatewayv2_api.api.api_endpoint
      MAIL_SERVICE_KEY              = data.aws_ssm_parameter.gcnotify_key.value
      MAIL_SERVICE_BASE_URL         = var.mail_base_url
      MAIL_SERVICE_DEFAULT_TO_EMAIL = var.mail_default_to
      SNS_PARSER_RESULTS_TOPIC      = "arn:aws:sns:${var.region}:${var.target_aws_account_id}:parser-results-topic"
      SNS_RECONCILER_RESULTS_TOPIC  = "arn:aws:sns:${var.region}:${var.target_aws_account_id}:reconciliation-results-topic"
      DISABLE_AUTOMATED_RECONCILIATION = var.disable_automated_reconciliation
    }
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to tags, e.g. because a management agent
      # updates these based on some ruleset managed elsewhere.
      filename,
      source_code_hash,
    ]
  }
}

resource "aws_s3_bucket_notification" "aws-lambda-trigger" {
  bucket = "${aws_s3_bucket.sftp_storage.id}"
  lambda_function {
    lambda_function_arn = "${aws_lambda_function.parser.arn}"
    events              = ["s3:ObjectCreated:*"]
  }
}

resource "aws_lambda_permission" "trigger-parse" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.parser.function_name}"
  principal = "s3.amazonaws.com"
  source_arn = "arn:aws:s3:::${aws_s3_bucket.sftp_storage.id}"
}

output "arn" {
  value = "${aws_lambda_function.parser.arn}"
}

