resource "aws_lambda_function" "daily-alert" {
  description                    = "Daily alert function ${local.namespace}"
  function_name                  = "dailyFileCheck"
  role                           = aws_iam_role.lambda.arn
  runtime                        = "nodejs18.x"
  filename                       = "build/empty_lambda.zip"
  source_code_hash               = filebase64sha256("build/empty_lambda.zip")
  handler                        = "src/lambdas/dailyfilecheck.handler"
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

resource "aws_lambda_permission" "daily_alert_cloudwatch_permission" {
  function_name = aws_lambda_function.daily-alert.function_name
  statement_id = "CloudWatchInvoke"
  action = "lambda:InvokeFunction"

  source_arn = aws_cloudwatch_event_rule.daily_alert_trigger.arn
  principal = "events.amazonaws.com"
}

resource "aws_cloudwatch_event_rule" "daily_alert_trigger" {
  name = "daily"
  schedule_expression = "cron(0 11,14,17 * * *)"
}

resource "aws_cloudwatch_event_target" "invoke_daily_alert" {
  rule = aws_cloudwatch_event_rule.daily_alert_trigger.name
  arn = aws_lambda_function.daily-alert.arn
}