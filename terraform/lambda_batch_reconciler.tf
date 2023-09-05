resource "aws_lambda_function" "batch_reconciler" {
  description                    = "Manual Batch Reconciliation function ${local.namespace}"
  function_name                  = "batch_reconciler"
  role                           = aws_iam_role.lambda.arn
  runtime                        = "nodejs18.x"
  filename                       = "build/empty_lambda.zip"
  source_code_hash               = filebase64sha256("build/empty_lambda.zip")
  handler                        = "src/lambdas/batch-reconcile.handler"
  memory_size                    = 1024
  timeout                        = 900
  reserved_concurrent_executions = 1

  vpc_config {
    security_group_ids = [data.aws_security_group.app.id]
    subnet_ids         = data.aws_subnets.app.ids
  }

  environment {
    variables = {
      APP_VERSION                   = var.app_version
      NODE_ENV                      = "production"
      RUNTIME_ENV                   = var.target_env
      DB_USER                       = var.db_username
      DB_PASSWORD                   = data.aws_ssm_parameter.postgres_password.value
      DB_HOST                       = aws_rds_cluster.pgsql.endpoint
      DB_NAME                       = aws_rds_cluster.pgsql.database_name
      MAIL_SERVICE_KEY              = data.aws_ssm_parameter.gcnotify_key.value
      MAIL_SERVICE_BASE_URL         = var.mail_base_url
      MAIL_SERVICE_DEFAULT_TO_EMAIL = var.mail_default_to
      SNS_TRIGGER_RECONCILIATION_TOPIC_ARN    = aws_sns_topic.trigger_reconciliation.arn
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