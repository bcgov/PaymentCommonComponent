resource "aws_lambda_function" "seeder" {
  description                    = "Database seeder function ${local.namespace}"
  function_name                  = "seeder"
  role                           = aws_iam_role.lambda.arn
  runtime                        = "nodejs18.x"
  filename                       = "build/empty_lambda.zip"
  source_code_hash               = filebase64sha256("build/empty_lambda.zip")
  handler                        = "src/database/seeder.handler"
  memory_size                    = 10240
  timeout                        = 900
  reserved_concurrent_executions = 1

  vpc_config {
    security_group_ids = [data.aws_security_group.app.id]
    subnet_ids         = data.aws_subnets.app.ids
  }

  environment {
    variables = {
      APP_VERSION = var.app_version
      API_VERSION = var.api_version
      NODE_ENV    = "production"
      RUNTIME_ENV = var.target_env
      DB_USER     = var.db_username
      DB_PASSWORD = data.aws_ssm_parameter.postgres_password.value
      DB_HOST     = aws_rds_cluster.pgsql.endpoint
      DB_NAME     = aws_rds_cluster.pgsql.database_name

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
