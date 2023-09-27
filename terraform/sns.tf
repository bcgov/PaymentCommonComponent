resource "aws_sns_topic" "trigger_report" {
  name = "trigger-report"
}

resource "aws_sns_topic" "trigger_reconciliation" {
  name = "trigger_reconciliation"
}

resource "aws_sns_topic_subscription" "trigger_report_target" {
  topic_arn = aws_sns_topic.trigger_report.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.reports.arn
}

resource "aws_sns_topic_subscription" "trigger_reconciliation_target" {
  topic_arn = aws_sns_topic.trigger_reconciliation.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.reconciler.arn
}


resource "aws_lambda_permission" "trigger_reconciliation_sns_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reconciler.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.trigger_reconciliation.arn
}

resource "aws_lambda_permission" "trigger_report_sns_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reports.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.trigger_report.arn
}