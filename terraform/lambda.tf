resource "aws_lambda_function" "csvTransformer" {
  description                    = "csvTransformer function ${local.namespace}"
  function_name                  = "csvTransformer"
  role                           = aws_iam_role.lambda.arn
  runtime                        = "nodejs16.x"
  filename                       = "build/empty_lambda.zip"
  source_code_hash               = filebase64sha256("build/empty_lambda.zip")
  handler                        = "index.handler"
  memory_size                    = 512
  timeout                        = 60
  reserved_concurrent_executions = 1

  environment {
    variables = {
      NODE_ENV = var.target_env
    }
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to tags, e.g. because a management agent
      # updates these based on some ruleset managed elsewhere.
      filename,
      source_code_hash,
      source_code_size,
      last_modified,
    ]
  }
}

resource "aws_cloudwatch_event_rule" "csvTransformer" {
  name                = "csvTransformer"
  description         = "Fires every day at 3 AM UTC - 8PM PST"
  schedule_expression = "cron(0 03 * * ? *)"
}

resource "aws_cloudwatch_event_target" "csvTransformer" {
  rule = aws_cloudwatch_event_rule.csvTransformer.name
  arn  = aws_lambda_function.csvTransformer.arn
}


resource "aws_lambda_permission" "csvTransformer" {
  statement_id  = "AllowExecutionFromCloudWatch-csvTransformer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.csvTransformer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.csvTransformer.arn
}
